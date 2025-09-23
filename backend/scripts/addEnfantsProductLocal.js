const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1) S'assurer que la catégorie "Enfants" existe
    let enfants = await Category.findOne({ name: 'Enfants' });
    if (!enfants) {
      enfants = new Category({
        name: 'Enfants',
        description: 'Mode pour enfants',
        image: 'categorie/enfants.jpg',
        icon: 'child',
        order: 3,
        isActive: true,
      });
      await enfants.save();
      console.log('📂 Catégorie "Enfants" créée');
    } else {
      console.log('📂 Catégorie "Enfants" déjà existante');
    }

    // 2) Ajouter un nouveau produit Enfants en utilisant les images locales
    // Placez les images sous backend/uploads/produit/ (déjà présentes: img1.jpg, img2.jpg, ...)
    const productData = {
      name: 'Ensemble Enfant Sport',
      description: 'Ensemble confortable pour enfants, idéal pour l\'école et les activités sportives. Tissu doux et respirant.',
      shortDescription: 'Ensemble enfant sport confortable',
      price: 59.99,
      originalPrice: 69.99,
      discount: 15,
      category: enfants._id,
      brand: 'Delta Fashion Kids',
      sku: `KID-SET-${Date.now()}`,
      images: [
        // Les routes locales seront servies via /uploads/<ref>
        'produit/img1.jpg',
        'produit/img2.jpg',
      ],
      variants: [
        { size: 'S', color: 'Bleu', stock: 8, price: 59.99 },
        { size: 'M', color: 'Bleu', stock: 10, price: 59.99 },
        { size: 'L', color: 'Bleu', stock: 6, price: 59.99 },
      ],
      colors: [
        { name: 'Bleu', code: '#1E90FF' },
      ],
      sizes: ['S', 'M', 'L'],
      isFeatured: true,
      isNewProduct: true,
      isOnSale: true,
      tags: ['enfant', 'ensemble', 'sport'],
      totalStock: 24,
    };

    const product = new Product(productData);
    // recalcul de sécurité si schéma évolue
    if (product.variants && product.variants.length) {
      product.totalStock = product.variants.reduce((t, v) => t + (v.stock || 0), 0);
    }
    await product.save();
    console.log('🛍️ Nouveau produit Enfants ajouté:', product.name);

    console.log('\nℹ️ Images locales utilisées:');
    for (const img of product.images) {
      console.log(` - /uploads/${img}`);
    }
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  run();
}

module.exports = run;


