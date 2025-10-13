const mongoose = require('mongoose');
const Order = require('../models/Order');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta_fashion';

async function testOrderNumberGeneration() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n📝 Test de génération de numéro de commande...');

    // Test 1: Génération via méthode statique
    console.log('\n1. Test de la méthode statique generateUniqueOrderNumber:');
    for (let i = 0; i < 5; i++) {
      const orderNumber = await Order.generateUniqueOrderNumber();
      console.log(`   Numéro généré ${i + 1}: ${orderNumber}`);
    }

    // Test 2: Génération via création de commande
    console.log('\n2. Test de génération automatique lors de la création:');
    
    const orderData = {
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Produit Test',
        price: 150,
        quantity: 2
      }],
      shippingAddress: {
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        phone: '+216 98765432',
        email: 'ahmed@example.com',
        street: '123 Avenue Habib Bourguiba',
        city: 'Tunis'
      },
      subtotal: 300,
      total: 300,
      guestEmail: 'ahmed@example.com'
    };

    for (let i = 0; i < 3; i++) {
      const order = new Order(orderData);
      await order.save();
      console.log(`   Commande ${i + 1} créée avec le numéro: ${order.orderNumber}`);
      
      // Supprimer la commande pour éviter l'accumulation
      await Order.findByIdAndDelete(order._id);
    }

    // Test 3: Test de performance avec création simultanée
    console.log('\n3. Test de performance avec créations simultanées:');
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < 20; i++) {
      const order = new Order(orderData);
      promises.push(order.save());
    }

    const orders = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`   ✅ ${orders.length} commandes créées en ${endTime - startTime}ms`);
    
    // Vérifier l'unicité
    const orderNumbers = orders.map(order => order.orderNumber);
    const uniqueNumbers = [...new Set(orderNumbers)];
    
    if (uniqueNumbers.length === orders.length) {
      console.log(`   ✅ Tous les numéros sont uniques`);
    } else {
      console.log(`   ❌ Doublons détectés! ${orders.length - uniqueNumbers.length} doublons`);
    }

    // Afficher quelques exemples
    console.log('\n   Exemples de numéros générés:');
    orders.slice(0, 5).forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderNumber}`);
    });

    // Nettoyer les commandes de test
    await Order.deleteMany({ _id: { $in: orders.map(o => o._id) } });
    console.log(`   🧹 ${orders.length} commandes de test supprimées`);

    // Test 4: Vérification du format
    console.log('\n4. Vérification du format des numéros:');
    const testNumber = await Order.generateUniqueOrderNumber();
    const regex = /^CMD-\d{6}-\d{4}$/;
    
    if (regex.test(testNumber)) {
      console.log(`   ✅ Format correct: ${testNumber}`);
      
      // Analyser les composants
      const parts = testNumber.split('-');
      const datePart = parts[1];
      const randomPart = parts[2];
      
      const today = new Date();
      const expectedYear = today.getFullYear().toString().slice(-2);
      const expectedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const expectedDay = today.getDate().toString().padStart(2, '0');
      const expectedDatePart = `${expectedYear}${expectedMonth}${expectedDay}`;
      
      if (datePart === expectedDatePart) {
        console.log(`   ✅ Date correcte: ${datePart} (${expectedDatePart})`);
      } else {
        console.log(`   ❌ Date incorrecte: ${datePart}, attendu: ${expectedDatePart}`);
      }
      
      if (randomPart.length === 4 && /^\d{4}$/.test(randomPart)) {
        console.log(`   ✅ Partie aléatoire correcte: ${randomPart}`);
      } else {
        console.log(`   ❌ Partie aléatoire incorrecte: ${randomPart}`);
      }
    } else {
      console.log(`   ❌ Format incorrect: ${testNumber}`);
    }

    console.log('\n🎉 Tests terminés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter les tests
if (require.main === module) {
  testOrderNumberGeneration();
}

module.exports = testOrderNumberGeneration;
