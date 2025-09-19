const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function upsertEnfantsCategoryAndProduct() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1) Créer ou mettre à jour la catégorie "Enfants"
    const categoryName = 'Enfants';

    let enfants = await Category.findOne({ name: categoryName });
    if (!enfants) {
      enfants = new Category({
        name: categoryName,
        description: 'Mode pour enfants',
        // Image côté backend: placez l'image à backend/uploads/categorie/enfants.jpg
        // Elle sera servie via /uploads/categorie/enfants.jpg
        image: 'categorie/enfants.jpg',
        icon: 'child',
        order: 3,
        isActive: true,
      });
      await enfants.save();
      console.log('📂 Catégorie "Enfants" créée');
    } else {
      // mettre à jour l'image si absente
      if (!enfants.image) {
        enfants.image = 'categorie/enfants.jpg';
        await enfants.save();
      }
      console.log('📂 Catégorie "Enfants" déjà existante');
    }

    // 2) Créer un produit d'exemple pour Enfants (si aucun produit n'existe encore pour cette catégorie)
    const existingChildProduct = await Product.findOne({ category: enfants._id });
    if (!existingChildProduct) {
      const sampleProduct = new Product({
        name: 'T-shirt Enfant Coton',
        description: 'T-shirt doux et confortable pour enfants, parfait pour un usage quotidien.',
        shortDescription: 'T-shirt enfant en coton',
        price: 24.99,
        originalPrice: 29.99,
        discount: 15,
        category: enfants._id,
        brand: 'Delta Fashion Kids',
        // Placez les images à backend/uploads/produit/enfants_tshirt_1.jpg
        images: ['produit/enfants_tshirt_1.jpg'],
        variants: [
          { size: 'S', color: 'Blanc', stock: 10, price: 24.99 },
          { size: 'M', color: 'Blanc', stock: 12, price: 24.99 },
          { size: 'L', color: 'Blanc', stock: 8, price: 24.99 }
        ],
        colors: [{ name: 'Blanc', code: '#FFFFFF' }],
        sizes: ['S', 'M', 'L'],
        isFeatured: true,
        isNewProduct: true,
        isOnSale: true,
        tags: ['enfant', 'coton', 'tshirt'],
      });

      // Calculer totalStock à partir des variantes
      sampleProduct.totalStock = (sampleProduct.variants || []).reduce((t, v) => t + (v.stock || 0), 0);

      await sampleProduct.save();
      console.log('🛍️ Produit enfant créé');
    } else {
      console.log('🛍️ Un produit pour la catégorie "Enfants" existe déjà, aucune création.');
    }

    console.log('\n🎉 Ajout terminé.');
    console.log('N\'oubliez pas de placer vos fichiers images:');
    console.log(' - backend/uploads/categorie/enfants.jpg');
    console.log(' - backend/uploads/produit/enfants_tshirt_1.jpg');
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  upsertEnfantsCategoryAndProduct();
}
