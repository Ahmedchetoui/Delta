const mongoose = require('mongoose');
require('dotenv').config();

const Banner = require('../models/Banner');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function addDefaultBanner() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier s'il y a déjà des bannières
    const existingBanners = await Banner.countDocuments();
    if (existingBanners > 0) {
      console.log(`ℹ️  ${existingBanners} bannière(s) déjà présente(s)`);
      return;
    }

    // Créer une bannière par défaut
    const defaultBanner = new Banner({
      title: "Bienvenue chez Delta Fashion",
      subtitle: "Votre style, notre passion",
      description: "Découvrez notre collection exclusive de vêtements tendance",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      buttonText: "Découvrir la boutique",
      buttonLink: "/shop",
      order: 0,
      isActive: true,
      backgroundColor: "#1f2937",
      textColor: "#ffffff",
      position: "center"
    });

    await defaultBanner.save();
    console.log('✅ Bannière par défaut créée avec succès !');
    console.log(`   Titre: ${defaultBanner.title}`);
    console.log(`   ID: ${defaultBanner._id}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  addDefaultBanner();
}

module.exports = addDefaultBanner;
