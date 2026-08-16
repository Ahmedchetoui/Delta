const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');

const clients = new Set();
const streams = [];
let started = false;

// Les consultations d'une fiche produit modifient seulement le compteur de
// vues. Elles ne doivent pas déclencher un rechargement du catalogue chez tous
// les visiteurs connectés.
const NON_CATALOG_FIELDS = new Set(['viewCount', 'updatedAt', '__v']);

function send(res, event, payload) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  } catch (_error) {
    clients.delete(res);
  }
}

function publishCatalogUpdate(resource) {
  const payload = {
    resource,
    updatedAt: new Date().toISOString(),
  };

  clients.forEach((res) => send(res, 'catalog-update', payload));
}

function addCatalogClient(req, res) {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write('retry: 5000\n\n');
  send(res, 'connected', { connectedAt: new Date().toISOString() });

  clients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (_error) {
      // Le gestionnaire close supprime aussi ce client.
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

function shouldPublish(change) {
  if (change.operationType !== 'update') return true;

  const changedFields = [
    ...Object.keys(change.updateDescription?.updatedFields || {}),
    ...(change.updateDescription?.removedFields || []),
  ];

  return changedFields.some((field) => {
    const root = field.split('.')[0];
    return !NON_CATALOG_FIELDS.has(root);
  });
}

function startCatalogRealtime() {
  if (started) return;
  started = true;

  const watchedCollections = [
    ['products', Product],
    ['categories', Category],
    ['banners', Banner],
  ];

  watchedCollections.forEach(([resource, Model]) => {
    try {
      const stream = Model.watch();
      streams.push(stream);

      stream.on('change', (change) => {
        if (shouldPublish(change)) publishCatalogUpdate(resource);
      });
      stream.on('error', (error) => {
        // Les change streams nécessitent MongoDB Atlas / replica set. Le
        // frontend conserve un rafraîchissement de secours si indisponible.
        console.warn(`⚠️ Temps réel catalogue (${resource}) indisponible:`, error.message);
      });
    } catch (error) {
      console.warn(`⚠️ Impossible de démarrer le temps réel (${resource}):`, error.message);
    }
  });
}

async function closeCatalogRealtime() {
  await Promise.allSettled(streams.map((stream) => stream.close()));
  clients.forEach((res) => res.end());
  clients.clear();
}

module.exports = {
  addCatalogClient,
  closeCatalogRealtime,
  publishCatalogUpdate,
  startCatalogRealtime,
};
