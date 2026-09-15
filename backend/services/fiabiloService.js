const { getFiabiloStateCategory } = require('../utils/fiabiloTracking');

const FIABILO_API_URL =
  process.env.FIABILO_API_URL || 'https://www.fiabilo.tn/api/v1/post.php';

function getShipmentToken() {
  return process.env.FIABILO_API_TOKEN || process.env.FIABILO_TOKEN || '';
}

function getTrackingToken() {
  return (
    process.env.FIABILO_TRACKING_TOKEN ||
    process.env.FIABILO_ETAT_TOKEN ||
    ''
  );
}

function resolveTrackingCode(order) {
  if (!order) return null;
  return order.fiabilo?.trackingCode || order.trackingNumber || null;
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(-8);
  }
  return digits;
}

function buildShipmentPayload(order) {
  const token = getShipmentToken();
  if (!token) {
    return null;
  }

  const addr = order.shippingAddress || {};
  const nom = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
  // Group items by product name
  const grouped = {};
  for (const item of order.items) {
    const name = item.name || 'Article';
    if (!grouped[name]) {
      grouped[name] = { qty: 0, variants: [] };
    }
    grouped[name].qty += item.quantity;
    const variant = [item.color, item.size].filter(Boolean).join(' ');
    if (variant) {
      for (let i = 0; i < item.quantity; i++) {
        grouped[name].variants.push(variant);
      }
    }
  }
  const designation = Object.entries(grouped)
    .map(([name, { qty, variants }]) => {
      if (variants.length > 0) {
        return `${qty} ${name} : ${variants.join(' / ')}`;
      }
      return `${qty} ${name}`;
    })
    .join(' , ');

  return {
    prix: String(order.total),
    nom,
    gouvernerat: addr.governorate || 'Monastir',
    ville: addr.city || '',
    adresse: addr.street || '',
    cp: addr.postalCode || '5000',
    tel: normalizePhone(addr.phone),
    tel2: '',
    designation: designation.slice(0, 250),
    nb_article: String(Object.values(grouped).reduce((s, g) => s + g.qty, 0) || 1),
    msg: order.notes?.customer || `Commande ${order.orderNumber}`,
    echange: '0',
    article: '',
    nb_echange: '0',
    ouvrir: '0',
    token,
  };
}

async function postFormData(fields) {
  const body = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    body.append(key, value == null ? '' : String(value));
  });

  const response = await fetch(FIABILO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Réponse Fiabilo invalide: ${text.slice(0, 200)}`);
  }

  return data;
}

async function createFiabiloShipment(order) {
  const payload = buildShipmentPayload(order);
  if (!payload) {
    console.warn('[Fiabilo] FIABILO_API_TOKEN non configuré — envoi ignoré');
    return null;
  }

  const data = await postFormData(payload);

  if (data.status !== 1) {
    throw new Error(data.status_message || 'Échec de création du colis Fiabilo');
  }

  return {
    trackingCode: data.status_message,
    labelUrl: data.lien || null,
  };
}

async function trackFiabiloShipment(trackingCode) {
  const token = getTrackingToken();
  const code = String(trackingCode || '').trim();

  if (!token) {
    throw new Error('Token de suivi Fiabilo non configuré (FIABILO_TRACKING_TOKEN)');
  }
  if (!code) {
    throw new Error('Code de suivi Fiabilo manquant');
  }

  const data = await postFormData({
    code,
    token,
  });

  if (data.status !== 1) {
    throw new Error(data.status_message || 'Suivi Fiabilo indisponible');
  }

  const etat = data.etat || 'Inconnu';

  return {
    status: etat,
    reason: data.motif || null,
    trackingCode: data.status_message || code,
    category: getFiabiloStateCategory(etat),
    raw: data,
  };
}

async function refreshOrderFiabiloTracking(order) {
  const code = resolveTrackingCode(order);
  if (!code) {
    return null;
  }

  return trackFiabiloShipment(code);
}

let fiabiloSyncTimer = null;
let isSyncInProgress = false;

/**
 * Applique le statut de suivi Fiabilo à une commande et met à jour automatiquement
 * les statuts (livré avec paiement, retour avec annulation et remise en stock, expédié).
 */
async function applyFiabiloTrackingToOrder(order, tracking) {
  const { restoreOrderStock } = require('../utils/stockUtils');
  let orderModified = false;
  let stockRestored = false;

  if (!order || !tracking) return { orderModified, stockRestored };

  if (!order.fiabilo) order.fiabilo = {};
  if (order.fiabilo.status !== tracking.status) {
    order.fiabilo.status = tracking.status;
    orderModified = true;
  }
  if (tracking.trackingCode && order.fiabilo.trackingCode !== tracking.trackingCode) {
    order.fiabilo.trackingCode = tracking.trackingCode;
    orderModified = true;
  }
  order.fiabilo.syncedAt = new Date();
  order.fiabilo.error = null;

  // 1. Colis livré (delivered) -> Commande livrée et payée (COD)
  if (tracking.category === 'delivered' && order.orderStatus !== 'delivered') {
    order.orderStatus = 'delivered';
    order.deliveredAt = order.deliveredAt || new Date();
    order.paymentStatus = 'paid';
    orderModified = true;
  }
  // 2. Colis retourné ou refusé (return) -> Annulation et remise en stock
  else if (tracking.category === 'return' && order.orderStatus !== 'cancelled') {
    order.orderStatus = 'cancelled';
    order.cancelledAt = order.cancelledAt || new Date();
    order.cancellationReason = `Retour colis Fiabilo: ${tracking.reason || tracking.status}`;

    if (order.stockDeducted) {
      try {
        await restoreOrderStock(order);
        order.stockDeducted = false;
        stockRestored = true;
      } catch (stockErr) {
        console.error(`⚠️ Erreur restauration stock commande ${order.orderNumber}:`, stockErr.message);
      }
    }
    orderModified = true;
  }
  // 3. Colis en transit (in_transit) -> Marquer expédié si encore pending ou confirmed
  else if (tracking.category === 'in_transit' && ['pending', 'confirmed'].includes(order.orderStatus)) {
    order.orderStatus = 'shipped';
    order.shippedAt = order.shippedAt || new Date();
    orderModified = true;
  }

  if (orderModified) {
    await order.save();
  }

  return { orderModified, stockRestored };
}

async function attachFiabiloTrackingToOrder(order, { live = false } = {}) {
  const code = resolveTrackingCode(order);
  if (!code) {
    return { fiabiloTracking: null };
  }

  try {
    const shouldFetchLive = live || !order.fiabilo?.status;
    if (!shouldFetchLive) {
      return {
        fiabiloTracking: {
          status: order.fiabilo.status,
          trackingCode: code,
          reason: null,
          category: getFiabiloStateCategory(order.fiabilo.status),
          cached: true,
        },
      };
    }

    const tracking = await refreshOrderFiabiloTracking(order);
    if (tracking && order._id) {
      const Order = require('../models/Order');
      const freshOrder = await Order.findById(order._id);
      if (freshOrder) {
        const { stockRestored } = await applyFiabiloTrackingToOrder(freshOrder, tracking);
        if (stockRestored) {
          const { publishCatalogUpdate } = require('./catalogRealtime');
          publishCatalogUpdate('stock');
        }
      }
    }

    return { fiabiloTracking: tracking };
  } catch (error) {
    return {
      fiabiloTracking: null,
      fiabiloTrackingError: error.message,
    };
  }
}

/**
 * Synchronise les statuts des commandes actives auprès de l'API Fiabilo
 */
async function syncActiveFiabiloOrders({ limit = 50 } = {}) {
  const token = getTrackingToken();
  if (!token) {
    return {
      success: false,
      message: 'Token de suivi Fiabilo (FIABILO_TRACKING_TOKEN) non configuré',
      totalChecked: 0,
    };
  }

  const Order = require('../models/Order');
  const { publishCatalogUpdate } = require('./catalogRealtime');

  const activeOrders = await Order.find({
    $or: [
      { 'fiabilo.trackingCode': { $exists: true, $ne: '' } },
      { trackingNumber: { $exists: true, $ne: '' } },
    ],
    orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
  })
    .sort({ 'fiabilo.syncedAt': 1, updatedAt: 1 })
    .limit(limit);

  const report = {
    totalChecked: activeOrders.length,
    delivered: 0,
    cancelled: 0,
    inTransit: 0,
    unchanged: 0,
    errors: [],
  };

  if (activeOrders.length === 0) {
    return { success: true, ...report };
  }

  let totalStockRestored = false;

  for (const order of activeOrders) {
    const code = resolveTrackingCode(order);
    if (!code) continue;

    try {
      // Petite temporisation de 300ms pour ménager l'API Fiabilo
      await new Promise((r) => setTimeout(r, 300));

      const tracking = await trackFiabiloShipment(code);
      const prevStatus = order.orderStatus;
      const { stockRestored } = await applyFiabiloTrackingToOrder(order, tracking);

      if (stockRestored) totalStockRestored = true;

      if (order.orderStatus === 'delivered' && prevStatus !== 'delivered') {
        report.delivered += 1;
        console.log(`📦 [Fiabilo Auto-Sync] Commande ${order.orderNumber} marquée LIVRÉE`);
      } else if (order.orderStatus === 'cancelled' && prevStatus !== 'cancelled') {
        report.cancelled += 1;
        console.log(`📦 [Fiabilo Auto-Sync] Commande ${order.orderNumber} marquée ANNULÉE (${tracking.status})`);
      } else if (order.orderStatus === 'shipped' && prevStatus !== 'shipped') {
        report.inTransit += 1;
        console.log(`📦 [Fiabilo Auto-Sync] Commande ${order.orderNumber} marquée EXPÉDIÉE`);
      } else {
        report.unchanged += 1;
      }
    } catch (err) {
      report.errors.push({
        orderNumber: order.orderNumber,
        trackingCode: code,
        error: err.message,
      });
      console.warn(`⚠️ [Fiabilo Auto-Sync] Commande ${order.orderNumber} (${code}):`, err.message);
    }
  }

  if (totalStockRestored) {
    publishCatalogUpdate('stock');
  }

  return { success: true, ...report };
}

/**
 * Démarre le cron de synchronisation Fiabilo périodique
 */
function startFiabiloSyncCron({ intervalMinutes } = {}) {
  const mins = parseInt(intervalMinutes || process.env.FIABILO_SYNC_INTERVAL_MINUTES || '30', 10);
  if (mins <= 0) {
    console.log('📦 Cron synchronisation Fiabilo désactivé');
    return;
  }

  const intervalMs = Math.max(5, mins) * 60 * 1000;

  if (fiabiloSyncTimer) {
    clearInterval(fiabiloSyncTimer);
  }

  console.log(`📦 Cron synchronisation Fiabilo actif (toutes les ${mins} minutes)`);

  fiabiloSyncTimer = setInterval(async () => {
    if (isSyncInProgress) return;
    isSyncInProgress = true;
    try {
      console.log('🔄 [Fiabilo Cron] Synchronisation des statuts en cours...');
      const result = await syncActiveFiabiloOrders({ limit: 50 });
      if (result.totalChecked > 0) {
        console.log(`✅ [Fiabilo Cron] Synchronisation terminée: ${result.totalChecked} vérifiées, ${result.delivered} livrées, ${result.cancelled} annulées, ${result.inTransit} expédiées`);
      }
    } catch (cronErr) {
      console.error('⚠️ [Fiabilo Cron] Erreur lors de la synchronisation:', cronErr.message);
    } finally {
      isSyncInProgress = false;
    }
  }, intervalMs);

  if (typeof fiabiloSyncTimer.unref === 'function') {
    fiabiloSyncTimer.unref();
  }
}

function stopFiabiloSyncCron() {
  if (fiabiloSyncTimer) {
    clearInterval(fiabiloSyncTimer);
    fiabiloSyncTimer = null;
  }
}

module.exports = {
  createFiabiloShipment,
  trackFiabiloShipment,
  refreshOrderFiabiloTracking,
  attachFiabiloTrackingToOrder,
  applyFiabiloTrackingToOrder,
  syncActiveFiabiloOrders,
  startFiabiloSyncCron,
  stopFiabiloSyncCron,
  resolveTrackingCode,
  getTrackingToken,
};
