const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

const resetAdminPassword = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver l'admin
    const admin = await User.findOne({ email: 'ahmedchetoui987@gmail.com' });
    
    if (!admin) {
      console.log('❌ Admin non trouvé');
      return;
    }

    // Définir le nouveau mot de passe en clair (sera hashé par le hook pre('save'))
    admin.password = '200223Ata';
    admin.role = 'admin';
    admin.isActive = true;
    admin.emailVerified = true;

    await admin.save();
    console.log('✅ Mot de passe admin réinitialisé avec succès');
    console.log('📧 Email: ahmedchetoui987@gmail.com');
    console.log('🔑 Mot de passe: 200223Ata');
    console.log('👑 Rôle: Admin');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le script
resetAdminPassword();
