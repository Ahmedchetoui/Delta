const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function checkCategoryImage() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier la catégorie Enfants
    const enfantsCategory = await Category.findOne({ name: 'Enfants' });
    
    if (enfantsCategory) {
      console.log('📂 Catégorie Enfants trouvée:');
      console.log(`  - ID: ${enfantsCategory._id}`);
      console.log(`  - Nom: ${enfantsCategory.name}`);
      console.log(`  - Slug: ${enfantsCategory.slug}`);
      console.log(`  - Image: ${enfantsCategory.image}`);
      console.log(`  - URL complète: /uploads/${enfantsCategory.image}`);
      
      // Mettre à jour l'image si nécessaire
      if (!enfantsCategory.image || enfantsCategory.image !== 'categorie/enfants.jpg') {
        enfantsCategory.image = 'categorie/enfants.jpg';
        await enfantsCategory.save();
        console.log('✅ Image de catégorie mise à jour');
      }
    } else {
      console.log('❌ Catégorie Enfants non trouvée');
    }

    // Lister toutes les catégories
    const allCategories = await Category.find({});
    console.log('\n📋 Toutes les catégories:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.image || 'Pas d\'image'}`);
    });

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  checkCategoryImage();
}

module.exports = checkCategoryImage;
