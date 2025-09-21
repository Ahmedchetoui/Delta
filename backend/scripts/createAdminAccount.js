const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importer le modèle User
const User = require('../models/User');

const createAdminAccount = async () => {
  try {
    console.log('🔑 Création/Mise à jour du compte admin...');

    // Connexion à MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion');
      console.log('✅ Connecté à MongoDB');
    }

    const adminEmail = 'ahmedchetoui987@gmail.com';
    const adminPassword = '200223Ata';

    // Vérifier si l'utilisateur existe déjà
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('👤 Utilisateur trouvé, mise à jour...');
      
      // Mettre à jour le mot de passe et le rôle
      adminUser.password = adminPassword; // Le middleware pre('save') va hasher automatiquement
      adminUser.role = 'admin';
      adminUser.firstName = 'Ahmed';
      adminUser.lastName = 'Chetoui';
      adminUser.isActive = true;
      
      await adminUser.save();
      console.log('✅ Compte admin mis à jour');
    } else {
      console.log('👤 Création d\'un nouveau compte admin...');
      
      // Créer un nouveau compte admin
      adminUser = new User({
        firstName: 'Ahmed',
        lastName: 'Chetoui',
        email: adminEmail,
        password: adminPassword, // Le middleware pre('save') va hasher automatiquement
        phone: '+216 12 345 678',
        role: 'admin',
        isActive: true,
        address: {
          street: '123 Rue de la Mode',
          city: 'Tunis',
          postalCode: '1000',
          country: 'Tunisie'
        }
      });

      await adminUser.save();
      console.log('✅ Nouveau compte admin créé');
    }

    console.log('\n🎉 Compte admin configuré avec succès !');
    console.log('\n🔑 Informations de connexion :');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔒 Mot de passe: ${adminPassword}`);
    console.log(`👑 Rôle: ${adminUser.role}`);
    console.log(`✅ Actif: ${adminUser.isActive}`);

    // Vérifier que le mot de passe fonctionne
    const isPasswordValid = await adminUser.comparePassword(adminPassword);
    console.log(`🔍 Test mot de passe: ${isPasswordValid ? '✅ Valide' : '❌ Invalide'}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
  } finally {
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('🔌 Déconnecté de MongoDB');
      process.exit(0);
    }
  }
};

// Exporter la fonction
module.exports = createAdminAccount;

// Exécuter le script seulement si ce fichier est appelé directement
if (require.main === module) {
  createAdminAccount();
}
