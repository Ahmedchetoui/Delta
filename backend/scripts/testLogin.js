const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const email = process.env.TEST_LOGIN_EMAIL;
const password = process.env.TEST_LOGIN_PASSWORD;

const testLogin = async () => {
  if (!email || !password) {
    console.error('❌ Définissez TEST_LOGIN_EMAIL et TEST_LOGIN_PASSWORD dans .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const user = await User.findOne({ email });
    console.log('👤 Utilisateur trouvé:', user ? 'OUI' : 'NON');

    if (user) {
      console.log('📧 Email:', user.email);
      console.log('👑 Rôle:', user.role);
      console.log('✅ Actif:', user.isActive);

      const isPasswordValid = await user.comparePassword(password);
      console.log('🔑 Mot de passe valide:', isPasswordValid);

      const directCompare = await bcrypt.compare(password, user.password);
      console.log('🔑 Comparaison directe bcrypt:', directCompare);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

testLogin();
