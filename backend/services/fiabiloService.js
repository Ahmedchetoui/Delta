const FIABILO_API_URL =
  process.env.FIABILO_API_URL || 'https://www.fiabilo.tn/api/v1/post.php';

function getToken() {
  return process.env.FIABILO_API_TOKEN || process.env.FIABILO_TOKEN || '';
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(-8);
  }
  return digits;
}

function buildShipmentPayload(order) {
  const token = getToken();
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
    ville: addr.city || 'Manzel ennour',
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
  const token = getToken();
  if (!token) {
    return null;
  }

  const data = await postFormData({
    code: trackingCode,
    token,
  });

  if (data.status !== 1) {
    throw new Error(data.status_message || 'Suivi Fiabilo indisponible');
  }

  return {
    status: data.etat,
    reason: data.motif,
    trackingCode: data.status_message || trackingCode,
  };
}

module.exports = {
  createFiabiloShipment,
  trackFiabiloShipment,
};
