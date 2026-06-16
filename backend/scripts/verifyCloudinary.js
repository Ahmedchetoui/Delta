/**
 * Vérifie la connexion Cloudinary.
 * Usage: npm run cloudinary:verify
 */
require('dotenv').config();
const { verifyCloudinaryConnection } = require('../config/cloudinary');

async function main() {
  console.log('🔍 Vérification Cloudinary...\n');

  const hasUrl = !!process.env.CLOUDINARY_URL;
  const hasVars = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  console.log(`CLOUDINARY_URL: ${hasUrl ? 'définie' : 'non définie'}`);
  console.log(`CLOUDINARY_CLOUD_NAME/API_KEY/SECRET: ${hasVars ? 'définies' : 'non définies'}`);
  console.log(`CLOUDINARY_FOLDER: ${process.env.CLOUDINARY_FOLDER || 'delta-fashion/uploads (défaut)'}`);
  console.log(`PUBLIC_BASE_URL: ${process.env.PUBLIC_BASE_URL || 'non définie'}\n`);

  const result = await verifyCloudinaryConnection();

  if (result.ok) {
    console.log('✅ Cloudinary connecté');
    console.log(`   Cloud: ${result.cloudName}`);
    console.log(`   Dossier: ${result.folder}`);
    process.exit(0);
  }

  console.error('❌ Cloudinary non disponible');
  console.error(`   ${result.message || 'Configurez les variables dans Render'}`);
  process.exit(1);
}

main();
