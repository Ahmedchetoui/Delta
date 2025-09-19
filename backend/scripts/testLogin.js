const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI;

const testLogin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const email = 'ahmedchetoui987@gmail.com';
    const password = '200223Ata';

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    console.log('👤 Utilisateur trouvé:', user ? 'OUI' : 'NON');
    
    if (user) {
      console.log('📧 Email:', user.email);
      console.log('👑 Rôle:', user.role);
      console.log('✅ Actif:', user.isActive);
      console.log('🔒 Mot de passe hashé:', user.password.substring(0, 20) + '...');
      
      // Test de comparaison du mot de passe
      const isPasswordValid = await user.comparePassword(password);
      console.log('🔑 Mot de passe valide:', isPasswordValid);
      
      // Test direct avec bcrypt
      const directCompare = await bcrypt.compare(password, user.password);
      console.log('🔑 Comparaison directe bcrypt:', directCompare);
      
      // Test de hachage du mot de passe de test
      const testHash = await bcrypt.hash(password, 12);
      console.log('🧪 Hash de test:', testHash.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le script
testLogin();
