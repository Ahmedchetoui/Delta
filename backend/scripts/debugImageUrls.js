const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function debugImageUrls() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier la catégorie Enfants et son image
    console.log('\n📂 === CATÉGORIE ENFANTS ===');
    const enfantsCategory = await Category.findOne({ name: 'Enfants' });
    if (enfantsCategory) {
      console.log(`ID: ${enfantsCategory._id}`);
      console.log(`Nom: ${enfantsCategory.name}`);
      console.log(`Image brute: ${enfantsCategory.image}`);
      
      // Simuler getImageUrl
      const getImageUrl = (filename) => {
        if (!filename) return null;
        if (/^https?:\/\//i.test(filename)) return filename;
        const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
        if (base) {
          return `${base}/uploads/${filename}`;
        }
        return `/uploads/${filename}`;
      };
      
      console.log(`URL générée: ${getImageUrl(enfantsCategory.image)}`);
      console.log(`PUBLIC_BASE_URL: ${process.env.PUBLIC_BASE_URL || 'NON DÉFINIE'}`);
    } else {
      console.log('❌ Catégorie Enfants non trouvée');
    }

    // 2. Vérifier les produits récents avec images
    console.log('\n🛍️ === PRODUITS RÉCENTS ===');
    const recentProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('category', 'name');

    recentProducts.forEach((product, index) => {
      console.log(`\n--- Produit ${index + 1} ---`);
      console.log(`ID: ${product._id}`);
      console.log(`Nom: ${product.name}`);
      console.log(`Catégorie: ${product.category?.name || 'N/A'}`);
      console.log(`Images brutes: ${JSON.stringify(product.images)}`);
      
      if (product.images && product.images.length > 0) {
        console.log('URLs générées:');
        product.images.forEach((img, i) => {
          const getImageUrl = (filename) => {
            if (!filename) return null;
            if (/^https?:\/\//i.test(filename)) return filename;
            const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
            if (base) {
              return `${base}/uploads/${filename}`;
            }
            return `/uploads/${filename}`;
          };
          console.log(`  ${i + 1}. ${getImageUrl(img)}`);
        });
      }
    });

    // 3. Test de connectivité vers les URLs
    console.log('\n🔍 === TEST DE CONNECTIVITÉ ===');
    console.log('Variables d\'environnement importantes:');
    console.log(`PUBLIC_BASE_URL: ${process.env.PUBLIC_BASE_URL || 'NON DÉFINIE'}`);
    console.log(`CLOUDINARY_URL: ${process.env.CLOUDINARY_URL ? 'DÉFINIE' : 'NON DÉFINIE'}`);
    console.log(`CLOUDINARY_FOLDER: ${process.env.CLOUDINARY_FOLDER || 'NON DÉFINIE'}`);

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  debugImageUrls();
}

module.exports = debugImageUrls;
