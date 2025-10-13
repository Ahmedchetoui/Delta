const mongoose = require('mongoose');
const Order = require('../models/Order');

// Configuration de test pour MongoDB
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/delta_fashion_test';

describe('Order Number Generation', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Nettoyer la collection avant chaque test
    await Order.deleteMany({});
  });

  test('should generate unique order number automatically', async () => {
    const orderData = {
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 100,
        quantity: 1
      }],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+216 12345678',
        email: 'john@example.com',
        street: '123 Test Street',
        city: 'Tunis'
      },
      subtotal: 100,
      total: 100,
      guestEmail: 'john@example.com'
    };

    const order = new Order(orderData);
    await order.save();

    expect(order.orderNumber).toBeDefined();
    expect(order.orderNumber).toMatch(/^CMD-\d{6}-\d{4}$/);
  });

  test('should generate different order numbers for multiple orders', async () => {
    const orderData = {
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 100,
        quantity: 1
      }],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+216 12345678',
        email: 'john@example.com',
        street: '123 Test Street',
        city: 'Tunis'
      },
      subtotal: 100,
      total: 100,
      guestEmail: 'john@example.com'
    };

    const order1 = new Order(orderData);
    const order2 = new Order(orderData);

    await order1.save();
    await order2.save();

    expect(order1.orderNumber).toBeDefined();
    expect(order2.orderNumber).toBeDefined();
    expect(order1.orderNumber).not.toBe(order2.orderNumber);
  });

  test('should use static method to generate unique order number', async () => {
    const orderNumber = await Order.generateUniqueOrderNumber();
    
    expect(orderNumber).toBeDefined();
    expect(orderNumber).toMatch(/^CMD-\d{6}-\d{4}$/);
    
    // Vérifier le format de la date
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const expectedDatePart = `${year}${month}${day}`;
    
    expect(orderNumber).toContain(expectedDatePart);
  });

  test('should handle concurrent order creation', async () => {
    const orderData = {
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 100,
        quantity: 1
      }],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+216 12345678',
        email: 'john@example.com',
        street: '123 Test Street',
        city: 'Tunis'
      },
      subtotal: 100,
      total: 100,
      guestEmail: 'john@example.com'
    };

    // Créer plusieurs commandes en parallèle
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const order = new Order(orderData);
      promises.push(order.save());
    }

    const orders = await Promise.all(promises);
    
    // Vérifier que tous les numéros de commande sont uniques
    const orderNumbers = orders.map(order => order.orderNumber);
    const uniqueOrderNumbers = [...new Set(orderNumbers)];
    
    expect(uniqueOrderNumbers.length).toBe(orders.length);
  });

  test('should not override existing order number', async () => {
    const customOrderNumber = 'CMD-CUSTOM-1234';
    
    const orderData = {
      orderNumber: customOrderNumber,
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 100,
        quantity: 1
      }],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+216 12345678',
        email: 'john@example.com',
        street: '123 Test Street',
        city: 'Tunis'
      },
      subtotal: 100,
      total: 100,
      guestEmail: 'john@example.com'
    };

    const order = new Order(orderData);
    await order.save();

    expect(order.orderNumber).toBe(customOrderNumber);
  });
});
