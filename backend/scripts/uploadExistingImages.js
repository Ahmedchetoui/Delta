const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Category = require('../models/Category');

// Configuration Cloudinary
let cloudinary = null;
const useCloudinary = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (useCloudinary) {
  try {
    cloudinary = require('cloudinary').v2;
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
    console.log('✅ Cloudinary configuré');
  } catch (e) {
    console.warn('❌ Cloudinary non disponible:', e?.message);
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function uploadExistingImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    if (!cloudinary) {
      console.log('❌ Cloudinary non configuré. Impossible d\'uploader les images.');
      return;
    }

    // 1. Traiter l'image de la catégorie Enfants
    console.log('\n📂 === UPLOAD IMAGE CATÉGORIE ENFANTS ===');
    
    const enfantsCategory = await Category.findOne({ name: 'Enfants' });
    if (!enfantsCategory) {
      console.log('❌ Catégorie Enfants non trouvée');
      return;
    }

    console.log(`Catégorie trouvée: ${enfantsCategory.name}`);
    console.log(`Image actuelle: ${enfantsCategory.image}`);

    // Vérifier si le fichier local existe
    const localImagePath = path.join(__dirname, '..', 'uploads', enfantsCategory.image);
    console.log(`Chemin local: ${localImagePath}`);

    if (fs.existsSync(localImagePath)) {
      console.log('✅ Fichier local trouvé, upload vers Cloudinary...');
      
      try {
        const result = await cloudinary.uploader.upload(localImagePath, {
          folder: process.env.CLOUDINARY_FOLDER || 'delta-fashion/uploads',
          public_id: 'categorie/enfants',
          resource_type: 'image'
        });

        console.log('✅ Upload réussi !');
        console.log(`URL Cloudinary: ${result.secure_url}`);

        // Mettre à jour la base de données avec l'URL Cloudinary
        enfantsCategory.image = result.secure_url;
        await enfantsCategory.save();

        console.log('✅ Base de données mise à jour');

      } catch (uploadError) {
        console.error('❌ Erreur upload Cloudinary:', uploadError.message);
      }

    } else {
      console.log('❌ Fichier local non trouvé');
      console.log('💡 Solution: Créez une nouvelle catégorie avec une image depuis l\'interface admin');
    }

    console.log('\n🎉 Traitement terminé !');

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  uploadExistingImages();
}

module.exports = uploadExistingImages;
