const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation pour la création de commande (utilisateurs connectés et invités)
const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Au moins un article est requis'),
  body('items.*.product')
    .isMongoId()
    .withMessage('ID de produit invalide'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prénom est requis'),
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom est requis'),
  body('shippingAddress.email')
    .isEmail()
    .withMessage('Email valide requis'),
  body('shippingAddress.phone')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Numéro de téléphone invalide'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('L\'adresse est requise'),
  body('shippingAddress.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La ville est requise'),
  body('paymentMethod')
    .isIn(['cash_on_delivery', 'bank_transfer', 'paypal', 'stripe'])
    .withMessage('Méthode de paiement invalide')
];

// @route   GET /api/orders
// @desc    Obtenir les commandes de l'utilisateur connecté ou toutes les commandes (admin)
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite invalide'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Statut invalide'),
  query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Statut de paiement invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      startDate,
      endDate
    } = req.query;

    // Construire le filtre
    const filter = {};

    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres commandes
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    if (status) {
      filter.orderStatus = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Ajouter les URLs d'images aux produits
    const ordersWithImageUrls = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        image: item.image ? `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/uploads/${item.image}` : null
      }))
    }));

    res.json({
      orders: ordersWithImageUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Obtenir une commande par ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images slug')
      .lean();

    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que l'utilisateur peut accéder à cette commande
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    // Ajouter les URLs d'images aux produits
    const orderWithImageUrls = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        image: item.image ? `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/uploads/${item.image}` : null
      }))
    };

    res.json({ order: orderWithImageUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

// @route   GET /api/orders/guest/:orderNumber/:email
// @desc    Obtenir une commande invité par numéro et email
// @access  Public
router.get('/guest/:orderNumber/:email', async (req, res) => {
  try {
    const { orderNumber, email } = req.params;

    const order = await Order.findOne({ 
      orderNumber: orderNumber,
      guestEmail: email.toLowerCase()
    })
      .populate('items.product', 'name images slug')
      .lean();

    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée. Vérifiez le numéro de commande et l\'email.'
      });
    }

    // Ajouter les URLs d'images aux produits
    const orderWithImageUrls = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        image: item.image ? `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/uploads/${item.image}` : null
      }))
    };

    res.json({ order: orderWithImageUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande invité:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

// @route   GET /api/orders/number/:orderNumber
// @desc    Obtenir une commande par numéro
// @access  Private
router.get('/number/:orderNumber', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images slug')
      .lean();

    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que l'utilisateur peut accéder à cette commande
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    // Ajouter les URLs d'images aux produits
    const orderWithImageUrls = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        image: item.image ? `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/uploads/${item.image}` : null
      }))
    };

    res.json({ order: orderWithImageUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

// @route   POST /api/orders
// @desc    Créer une nouvelle commande (utilisateurs connectés et invités)
// @access  Public/Private
router.post('/', optionalAuth, orderValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      isGift,
      giftMessage
    } = req.body;

    // Vérifier que tous les produits existent et sont disponibles
    const productIds = items.map(item => item.product);
    const products = await Product.find({ 
      _id: { $in: productIds }, 
      isActive: true 
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        message: 'Un ou plusieurs produits ne sont pas disponibles'
      });
    }

    // Vérifier le stock et calculer les prix
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product);
      
      if (!product) {
        return res.status(400).json({
          message: `Produit ${item.product} non trouvé`
        });
      }

      // Vérifier le stock
      if (product.totalStock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour le produit ${product.name}`
        });
      }

      // Calculer le prix final
      const finalPrice = product.getFinalPrice();
      const itemTotal = finalPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: finalPrice,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        image: product.images[0] || null,
        sku: product.sku || null
      });
    }

    // Calculer les frais de livraison (fixe à 7 DT comme dans le frontend)
    const shippingCost = 7.0;
    const tax = 0; // Pas de TVA pour simplifier
    const total = subtotal + shippingCost + tax;

    // Créer la commande (avec ou sans utilisateur connecté)
    const order = new Order({
      user: req.user ? req.user._id : null, // null pour les commandes invités
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      tax,
      total,
      notes,
      isGift: isGift === true,
      giftMessage,
      // Pour les invités, stocker l'email pour le suivi
      guestEmail: req.user ? null : shippingAddress.email
    });

    await order.save();

    // Mettre à jour le stock des produits
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product);
      if (product) {
        // Mettre à jour le stock total
        product.totalStock = Math.max(0, product.totalStock - item.quantity);
        
        // Mettre à jour le stock des variantes si applicable
        if (item.size && item.color) {
          product.updateStock(item.size, item.color, item.quantity);
        }
        
        await product.save();
      }
    }

    // Populate pour la réponse
    await order.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'items.product', select: 'name images slug' }
    ]);

    res.status(201).json({
      message: 'Commande créée avec succès',
      order: {
        ...order.toObject(),
        items: order.items.map(item => ({
          ...item,
          image: item.image ? `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/uploads/${item.image}` : null
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la commande'
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Mettre à jour le statut d'une commande
// @access  Private (Admin)
router.put('/:id/status', authenticateToken, requireAdmin, [
  body('orderStatus')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Statut de commande invalide'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Statut de paiement invalide'),
  body('trackingNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Numéro de suivi invalide'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes trop longues')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { orderStatus, paymentStatus, trackingNumber, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée'
      });
    }

    // Mettre à jour les champs
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = { ...order.notes, admin: notes };

    // Actions spéciales selon le statut
    if (orderStatus === 'delivered') {
      order.markAsDelivered();
    }

    if (orderStatus === 'cancelled') {
      order.cancelOrder('Annulée par l\'administrateur', 'admin');
    }

    await order.save();

    res.json({
      message: 'Statut de la commande mis à jour avec succès',
      order: {
        ...order.toObject(),
        items: order.items.map(item => ({
          ...item,
          image: item.image ? `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/uploads/${item.image}` : null
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Annuler une commande
// @access  Private
router.put('/:id/cancel', authenticateToken, [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Raison trop longue')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que l'utilisateur peut annuler cette commande
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    // Vérifier que la commande peut être annulée
    if (['delivered', 'cancelled', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: 'Cette commande ne peut pas être annulée'
      });
    }

    // Annuler la commande
    order.cancelOrder(reason || 'Annulée par le client', req.user.role === 'admin' ? 'admin' : 'customer');

    // Restaurer le stock des produits
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.totalStock += item.quantity;
        
        // Restaurer le stock des variantes si applicable
        if (item.size && item.color) {
          const variant = product.variants.find(v => 
            v.size === item.size && v.color === item.color
          );
          if (variant) {
            variant.stock += item.quantity;
          }
        }
        
        await product.save();
      }
    }

    await order.save();

    res.json({
      message: 'Commande annulée avec succès',
      order: {
        ...order.toObject(),
        items: order.items.map(item => ({
          ...item,
          image: item.image ? `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/uploads/${item.image}` : null
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'annulation de la commande'
    });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Obtenir les statistiques des commandes
// @access  Private (Admin)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculer la date de début selon la période
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'confirmed'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    };

    res.json({
      period,
      startDate,
      endDate: new Date(),
      stats: result
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
