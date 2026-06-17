#!/usr/bin/env node
/**
 * Garde uniquement la commande la plus récente, supprime les autres.
 * Usage: MONGODB_URI="..." node scripts/cleanupOrders.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function cleanupOrders() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI requis');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connecté à MongoDB');

  const total = await Order.countDocuments();
  if (total <= 1) {
    console.log(`ℹ️  ${total} commande(s) — rien à supprimer`);
    await mongoose.disconnect();
    return;
  }

  const latest = await Order.findOne().sort({ createdAt: -1 }).select('orderNumber createdAt');
  const deleteResult = await Order.deleteMany({ _id: { $ne: latest._id } });

  console.log(`🗑️  ${deleteResult.deletedCount} commande(s) supprimée(s)`);
  console.log(`✅ Commande conservée: ${latest.orderNumber} (${latest.createdAt.toISOString()})`);
  console.log(`📦 Total restant: ${await Order.countDocuments()}`);

  await mongoose.disconnect();
}

cleanupOrders().catch((error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});
