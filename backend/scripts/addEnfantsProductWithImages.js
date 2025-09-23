const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function addEnfantsProductWithImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1) Trouver la catégorie "Enfants"
    const enfantsCategory = await Category.findOne({ name: 'Enfants' });
    if (!enfantsCategory) {
      console.log('❌ Catégorie "Enfants" non trouvée');
      return;
    }
    console.log('📂 Catégorie "Enfants" trouvée:', enfantsCategory._id);

    // 2) Générer un nom unique avec timestamp
    const now = new Date();
    const uniqueId = now.getTime();
    const productName = `Vêtement Enfant Collection ${uniqueId}`;

    // 3) Créer le produit avec les 5 images
    const newProduct = new Product({
      name: productName,
      description: 'Magnifique collection de vêtements pour enfants. Conçue avec soin pour offrir confort et style. Matériaux de haute qualité, parfaits pour les enfants actifs. Design moderne et attrayant.',
      shortDescription: 'Collection enfant de qualité premium',
      price: 39.99,
      originalPrice: 49.99,
      discount: 20,
      category: enfantsCategory._id,
      brand: 'Delta Fashion Kids',
      images: [
        'produit/img1.jpg',
        'produit/img2.jpg', 
        'produit/img3.jpg',
        'produit/img4.jpg',
        'produit/img5.jpg'
      ],
      variants: [
        { size: 'S', color: 'Multicolore', stock: 12, price: 39.99 },
        { size: 'M', color: 'Multicolore', stock: 15, price: 39.99 },
        { size: 'L', color: 'Multicolore', stock: 10, price: 39.99 }
      ],
      colors: [
        { name: 'Multicolore', code: '#FF6B6B' }
      ],
      sizes: ['S', 'M', 'L'],
      isFeatured: true,
      isNewProduct: true,
      isOnSale: true,
      tags: ['enfant', 'collection', 'premium', 'confortable'],
      weight: 0.25,
      shipping: {
        freeShipping: true
      },
      metaTitle: `${productName} - Delta Fashion`,
      metaDescription: 'Collection premium pour enfants. Qualité et confort garantis.'
    });

    // Calculer le stock total
    newProduct.totalStock = newProduct.variants.reduce((total, variant) => total + variant.stock, 0);

    await newProduct.save();
    
    console.log('🎉 Produit créé avec succès !');
    console.log(`📝 Nom: ${newProduct.name}`);
    console.log(`🆔 ID: ${newProduct._id}`);
    console.log(`🏷️ Slug: ${newProduct.slug}`);
    console.log(`💰 Prix: ${newProduct.price}€`);
    console.log(`📦 Stock total: ${newProduct.totalStock}`);
    console.log(`🖼️ Images: ${newProduct.images.length} images`);
    
    console.log('\n📸 Images utilisées:');
    newProduct.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img}`);
    });

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  addEnfantsProductWithImages();
}

module.exports = addEnfantsProductWithImages;
