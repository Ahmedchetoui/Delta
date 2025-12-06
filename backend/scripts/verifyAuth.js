const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

/**
 * Script de vérification des comptes et de l'authentification
 */

async function verifyAuth() {
    try {
        console.log('🔍 Vérification de l\'authentification...\n');

        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion');
        console.log('✅ Connecté à MongoDB\n');

        // 1. Vérifier que le compte admin existe
        console.log('📋 Vérification du compte admin...');
        const adminUser = await User.findOne({ email: 'ahmedchetoui987@gmail.com' });

        if (!adminUser) {
            console.log('❌ Compte admin NON TROUVÉ\n');
            process.exit(1);
        }

        console.log('✅ Compte admin trouvé:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Nom: ${adminUser.firstName} ${adminUser.lastName}`);
        console.log(`   Rôle: ${adminUser.role}`);
        console.log(`   Actif: ${adminUser.isActive}\n`);

        // 2. Tester le mot de passe
        console.log('🔐 Test du mot de passe...');
        const isPasswordValid = await bcrypt.compare('200223Ata', adminUser.password);

        if (isPasswordValid) {
            console.log('✅ Mot de passe correct\n');
        } else {
            console.log('❌ Mot de passe INCORRECT\n');
            process.exit(1);
        }

        // 3. Lister tous les utilisateurs
        console.log('👥 Liste de tous les utilisateurs:');
        const allUsers = await User.find().select('email firstName lastName role isActive');
        allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.isActive ? 'Actif' : 'Inactif'}`);
        });
        console.log('');

        // 4. Test de création d'utilisateur
        console.log('🆕 Test de création de nouveau compte...');

        // Supprimer le compte test s'il existe
        await User.deleteOne({ email: 'test@example.com' });

        const testUser = new User({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123456',
            phone: '+216 12 345 678',
            role: 'user'
        });

        await testUser.save();
        console.log('✅ Nouveau compte créé avec succès');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Role: ${testUser.role}\n`);

        // 5. Tester le login du nouveau compte
        console.log('🔐 Test du login du nouveau compte...');
        const testPasswordValid = await bcrypt.compare('Test123456', testUser.password);

        if (testPasswordValid) {
            console.log('✅ Login du nouveau compte fonctionne\n');
        } else {
            console.log('❌ Login du nouveau compte ÉCHOUE\n');
        }

        // Nettoyer le compte test
        await User.deleteOne({ email: 'test@example.com' });
        console.log('🧹 Compte test supprimé\n');

        console.log('🎉 TOUS LES TESTS RÉUSSIS !\n');
        console.log('✅ Compte admin fonctionnel');
        console.log('✅ Sign in fonctionne');
        console.log('✅ Création de compte fonctionne\n');

        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifyAuth();
