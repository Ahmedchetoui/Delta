/**
 * Supprime tous les produits de la base de données.
 * Usage: node scripts/clearProducts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function clearProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion');
    const count = await Product.countDocuments();
    const result = await Product.deleteMany({});
    console.log(`✅ ${result.deletedCount} produit(s) supprimé(s) (sur ${count} trouvé(s))`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearProducts();
