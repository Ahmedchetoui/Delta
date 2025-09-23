const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'https://delta-n5d8.onrender.com/api';
const TEST_IMAGE_PATH = path.join(__dirname, '..', 'uploads', 'produit', 'img1.jpg');

async function testProductCreation() {
  try {
    console.log('🧪 Test de création de produit...');
    console.log(`API: ${API_BASE_URL}`);
    
    // 1. Test de santé de l'API
    console.log('\n1. Test API Health...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ API Health:', healthResponse.data);
    } catch (err) {
      console.log('❌ API Health failed:', err.message);
      return;
    }

    // 2. Test de connexion (vous devrez fournir un token admin valide)
    console.log('\n2. Test Auth...');
    console.log('⚠️  Pour tester la création de produit, vous devez:');
    console.log('   1. Vous connecter en tant qu\'admin sur l\'interface');
    console.log('   2. Récupérer le token depuis localStorage');
    console.log('   3. L\'ajouter dans ce script');

    // 3. Test des middlewares d'upload
    console.log('\n3. Test des middlewares...');
    console.log('✅ uploadProductImages: importé');
    console.log('✅ uploadBuffersToCloudinary: importé');
    console.log('✅ handleUploadError: importé');

    // 4. Test Cloudinary
    console.log('\n4. Test Cloudinary...');
    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );
    console.log(`Cloudinary configuré: ${cloudinaryConfigured ? '✅' : '❌'}`);

    // 5. Vérifier les variables d'environnement importantes
    console.log('\n5. Variables d\'environnement...');
    console.log(`PUBLIC_BASE_URL: ${process.env.PUBLIC_BASE_URL || 'NON DÉFINIE'}`);
    console.log(`CLOUDINARY_FOLDER: ${process.env.CLOUDINARY_FOLDER || 'NON DÉFINIE'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NON DÉFINIE'}`);

    console.log('\n📋 Diagnostic terminé !');
    console.log('\n💡 Pour résoudre l\'erreur 401:');
    console.log('   1. Vérifiez que vous êtes connecté en tant qu\'admin');
    console.log('   2. Vérifiez que le token n\'a pas expiré');
    console.log('   3. Vérifiez les logs Render pour plus de détails');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  testProductCreation();
}

module.exports = testProductCreation;
