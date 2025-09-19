const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/delta-fashion')
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    const users = await User.find({}, 'email role firstName lastName createdAt');
    
    console.log('\n📋 Comptes enregistrés dans le site :');
    console.log('=====================================');
    
    if (users.length === 0) {
      console.log('❌ Aucun compte trouvé');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Nom: ${user.firstName} ${user.lastName}`);
        console.log(`   Rôle: ${user.role}`);
        console.log(`   Créé le: ${user.createdAt.toLocaleDateString('fr-FR')}`);
        console.log('   ---');
      });
    }
    
    console.log(`\n📊 Total: ${users.length} compte(s)`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
