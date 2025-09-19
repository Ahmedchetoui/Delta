const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'ahmedchetoui987@gmail.com' });
    
    if (existingAdmin) {
      console.log('⚠️  L\'admin existe déjà. Mise à jour du rôle et réinitialisation du mot de passe...');
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.password = '200223Ata';
      await existingAdmin.save();
      console.log('✅ Rôle admin mis à jour et mot de passe réinitialisé');
    } else {
      // Créer le nouvel admin (laisser Mongoose hasher via pre-save)
      const admin = new User({
        firstName: 'Ahmed',
        lastName: 'Chetoui',
        email: 'ahmedchetoui987@gmail.com',
        password: '200223Ata',
        role: 'admin',
        isActive: true,
        emailVerified: true,
        phone: '+21612345678',
        address: {
          street: 'Avenue Habib Bourguiba',
          city: 'Tunis',
          postalCode: '1000',
          country: 'Tunisie'
        }
      });

      await admin.save();
      console.log('✅ Compte admin créé avec succès');
    }

    console.log('📧 Email: ahmedchetoui987@gmail.com');
    console.log('🔑 Mot de passe: 200223Ata');
    console.log('👑 Rôle: Admin');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le script
createAdmin();
