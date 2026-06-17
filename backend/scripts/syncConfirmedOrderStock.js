/**
 * Déduit le stock pour les commandes déjà confirmées sans stockDeducted.
 * Usage: npm run db:sync-stock  (ou MONGODB_URI=... node scripts/syncConfirmedOrderStock.js)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { deductOrderStock } = require('../utils/stockUtils');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI manquant');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const orders = await Order.find({
    orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
    $or: [{ stockDeducted: false }, { stockDeducted: { $exists: false } }],
  });

  if (orders.length === 0) {
    console.log('Aucune commande à synchroniser.');
    await mongoose.disconnect();
    return;
  }

  for (const order of orders) {
    console.log(`Déduction stock: ${order.orderNumber} (${order.orderStatus})`);
    await deductOrderStock(order);
    order.stockDeducted = true;
    await order.save();
  }

  console.log(`${orders.length} commande(s) synchronisée(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
