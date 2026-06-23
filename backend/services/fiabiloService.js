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
  const nbArticle = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsText = order.items
    .map((item) => {
      const parts = [item.name];
      if (item.size) parts.push(item.size);
      if (item.color) parts.push(item.color);
      return parts.join(' - ');
    })
    .join(', ');
  const designation = `totale ${nbArticle || 1} : ${itemsText}`;

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
    nb_article: String(nbArticle || 1),
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
      await Order.findByIdAndUpdate(order._id, {
        'fiabilo.status': tracking.status,
        'fiabilo.trackingCode': tracking.trackingCode,
      });
    }

    return { fiabiloTracking: tracking };
  } catch (error) {
    return {
      fiabiloTracking: null,
      fiabiloTrackingError: error.message,
    };
  }
}

module.exports = {
  createFiabiloShipment,
  trackFiabiloShipment,
  refreshOrderFiabiloTracking,
  attachFiabiloTrackingToOrder,
  resolveTrackingCode,
  getTrackingToken,
};
