#!/usr/bin/env node
/**
 * Migration script: re-upload local banner images to Cloudinary
 * 
 * Run: node backend/scripts/migrate-local-banners.js
 * 
 * This script finds all banners whose image/mobileImage reference
 * local files (not Cloudinary URLs) and re-uploads them to Cloudinary,
 * then updates the database with the new Cloudinary URLs.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Banner = require('../models/Banner');
const { cloudinary, enabled: useCloudinary, getCloudinaryFolder } = require('../config/cloudinary');

async function migrateBanners() {
  if (!useCloudinary || !cloudinary) {
    console.error('❌ Cloudinary non configuré. Vérifiez les variables d\'environnement.');
    process.exit(1);
  }

  console.log('🔗 Connexion à MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  const banners = await Banner.find();
  console.log(`📋 ${banners.length} bannière(s) trouvée(s)\n`);

  let migratedCount = 0;

  for (const banner of banners) {
    const fields = ['image', 'mobileImage'];
    let needsSave = false;

    for (const field of fields) {
      const ref = banner[field];
      if (!ref) continue;

      // Skip already-Cloudinary URLs
      if (/^https?:\/\//i.test(ref)) {
        if (ref.includes('cloudinary.com')) {
          console.log(`  ✅ ${field}: déjà sur Cloudinary`);
        } else {
          console.log(`  ⚠️  ${field}: URL distante non-Cloudinary: ${ref}`);
          // Try to download and re-upload
          try {
            const folder = getCloudinaryFolder();
            const result = await cloudinary.uploader.upload(ref, {
              folder,
              resource_type: 'image',
              quality: 'auto:good',
              fetch_format: 'auto',
            });
            banner[field] = result.secure_url;
            needsSave = true;
            console.log(`  🔄 ${field}: re-uploadé vers Cloudinary: ${result.secure_url}`);
          } catch (err) {
            console.error(`  ❌ ${field}: échec re-upload depuis URL: ${err.message}`);
          }
        }
        continue;
      }

      // Local file reference
      const uploadBase = path.join(__dirname, '..', process.env.UPLOAD_PATH || '../uploads');
      const filePath = path.join(uploadBase, ref);

      if (!fs.existsSync(filePath)) {
        console.log(`  ❌ ${field}: fichier local introuvable: ${filePath}`);
        continue;
      }

      console.log(`  📤 ${field}: upload local -> Cloudinary: ${ref}`);
      try {
        const folder = getCloudinaryFolder();
        const result = await cloudinary.uploader.upload(filePath, {
          folder,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
        });
        banner[field] = result.secure_url;
        needsSave = true;
        console.log(`  ✅ ${field}: migré vers: ${result.secure_url}`);
      } catch (err) {
        console.error(`  ❌ ${field}: échec upload Cloudinary: ${err.message}`);
      }
    }

    if (needsSave) {
      await banner.save();
      migratedCount++;
      console.log(`  💾 Bannière "${banner.title}" (${banner._id}) sauvegardée\n`);
    } else {
      console.log(`  ⏭️  Bannière "${banner.title}" — rien à migrer\n`);
    }
  }

  console.log(`\n🏁 Migration terminée: ${migratedCount}/${banners.length} bannière(s) migrée(s)`);
  await mongoose.disconnect();
}

migrateBanners().catch((err) => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
