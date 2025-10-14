const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

async function createTestData() {
  try {
    console.log('\n🔧 Création de données de test...');

    // Créer un utilisateur de test
    const testUser = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      {
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        email: 'test@example.com',
        phone: '+216 20 123 456',
        role: 'user'
      },
      { upsert: true, new: true }
    );

    // Créer une catégorie de test
    const testCategory = await Category.findOneAndUpdate(
      { name: 'Vêtements' },
      {
        name: 'Vêtements',
        description: 'Catégorie de vêtements',
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Créer un produit de test
    const testProduct = await Product.findOneAndUpdate(
      { name: 'T-shirt Test' },
      {
        name: 'T-shirt Test',
        description: 'T-shirt de test pour les commandes',
        price: 29.99,
        category: testCategory._id,
        totalStock: 100,
        images: ['https://via.placeholder.com/300x300?text=T-shirt'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [{ name: 'Blanc', code: '#FFFFFF' }, { name: 'Noir', code: '#000000' }],
        variants: [
          { size: 'S', color: 'Blanc', stock: 25 },
          { size: 'M', color: 'Blanc', stock: 25 },
          { size: 'L', color: 'Blanc', stock: 25 },
          { size: 'XL', color: 'Blanc', stock: 25 }
        ]
      },
      { upsert: true, new: true }
    );

    // Créer plusieurs commandes de test avec différents statuts
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const paymentStatuses = ['pending', 'paid', 'failed'];
    
    for (let i = 0; i < 10; i++) {
      const orderData = {
        user: testUser._id,
        items: [{
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          size: 'M',
          color: 'Blanc',
          image: testProduct.images[0]
        }],
        shippingAddress: {
          firstName: 'Ahmed',
          lastName: 'Ben Ali',
          street: '123 Rue de la Liberté',
          city: 'Tunis',
          postalCode: '1000',
          country: 'Tunisie',
          phone: '+216 20 123 456',
          email: 'test@example.com'
        },
        billingAddress: {
          firstName: 'Ahmed',
          lastName: 'Ben Ali',
          street: '123 Rue de la Liberté',
          city: 'Tunis',
          postalCode: '1000',
          country: 'Tunisie',
          phone: '+216 20 123 456',
          email: 'test@example.com'
        },
        paymentMethod: 'stripe',
        orderStatus: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        subtotal: testProduct.price * (Math.floor(Math.random() * 3) + 1),
        shippingCost: 5.00,
        tax: 0,
        discount: 0,
        notes: {
          customer: i % 3 === 0 ? 'Livraison rapide SVP' : '',
          admin: i % 4 === 0 ? 'Client VIP' : ''
        }
      };

      // Calculer le total
      orderData.total = orderData.subtotal + orderData.shippingCost + orderData.tax - orderData.discount;

      // Créer la commande (le numéro sera généré automatiquement)
      const order = new Order(orderData);
      await order.save();
      
      console.log(`✅ Commande créée: ${order.orderNumber} - Statut: ${order.orderStatus}`);
    }

    console.log('\n🎉 Données de test créées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  }
}

async function testOrderQueries() {
  try {
    console.log('\n🔍 Test des requêtes de commandes...');

    // Test 1: Récupérer toutes les commandes
    const allOrders = await Order.find().populate('user', 'firstName lastName email');
    console.log(`📊 Total des commandes: ${allOrders.length}`);

    // Test 2: Filtrer par statut
    const pendingOrders = await Order.find({ orderStatus: 'pending' });
    console.log(`⏳ Commandes en attente: ${pendingOrders.length}`);

    // Test 3: Recherche par numéro de commande
    if (allOrders.length > 0) {
      const firstOrder = allOrders[0];
      const foundOrder = await Order.findOne({ orderNumber: firstOrder.orderNumber });
      console.log(`🔍 Recherche par numéro: ${foundOrder ? '✅ Trouvée' : '❌ Non trouvée'}`);
    }

    // Test 4: Statistiques
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);
    
    console.log('\n📈 Statistiques par statut:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} commandes, Total: ${stat.totalAmount.toFixed(2)} TND`);
    });

  } catch (error) {
    console.error('❌ Erreur lors des tests de requêtes:', error);
  }
}

async function main() {
  console.log('🚀 Test de l\'interface admin des commandes\n');
  
  await connectDB();
  await createTestData();
  await testOrderQueries();
  
  console.log('\n✅ Tests terminés avec succès !');
  console.log('🌐 Vous pouvez maintenant tester l\'interface admin sur http://localhost:3000/admin/orders');
  
  await mongoose.disconnect();
  console.log('🔌 Déconnexion de MongoDB');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTestData, testOrderQueries };
