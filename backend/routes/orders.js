const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin, optionalAuth } = require('../middleware/auth');

const { deductOrderStock, restoreOrderStock } = require('../utils/stockUtils');
const {
  guestOrderLimiter,
  orderCreateBurstLimiter,
  orderCreateLimiter,
  orderEmailLimiter,
  orderPhoneLimiter,
} = require('../middleware/rateLimiters');
const { normalizeGuestPhone } = require('../utils/phoneUtils');
const { MAX_ITEM_QUANTITY, MAX_ORDER_ITEMS, PAYMENT_METHOD_COD } = require('../utils/orderConstants');
const { processOrder } = require('../services/orderQueue');
const { OrderServiceError } = require('../services/orderService');
const { attachFiabiloTrackingToOrder } = require('../services/fiabiloService');
const { getImageUrl } = require('../middleware/upload');

const router = express.Router();

function canAccessOrder(order, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!order.user) return false;
  const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
  return orderUserId === user._id.toString();
}

function mapOrderImages(order) {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      image: getImageUrl(item.image),
    })),
  };
}

// Validation pour la création de commande (utilisateurs connectés et invités)
const orderValidation = [
  body('items')
    .isArray({ min: 1, max: MAX_ORDER_ITEMS })
    .withMessage(`Entre 1 et ${MAX_ORDER_ITEMS} articles par commande`),
  body('items.*.product')
    .isMongoId()
    .withMessage('ID de produit invalide'),
  body('items.*.quantity')
    .isInt({ min: 1, max: MAX_ITEM_QUANTITY })
    .withMessage(`La quantité doit être entre 1 et ${MAX_ITEM_QUANTITY}`),
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prénom est requis'),
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom est requis'),
  body('shippingAddress.email')
    .optional({ values: 'falsy' })
    .isEmail()
    .withMessage('Email invalide'),
  body('shippingAddress.phone')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Numéro de téléphone invalide')
    .custom((value) => {
      const digits = String(value || '').replace(/\D/g, '');
      if (digits.length < 8) {
        throw new Error('Le numéro de téléphone doit contenir au moins 8 chiffres');
      }
      return true;
    }),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('L\'adresse est requise'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La ville est requise'),
  body('shippingAddress.governorate')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le gouvernorat est requis'),
  body('paymentMethod')
    .optional()
    .custom((value) => {
      if (value && value !== PAYMENT_METHOD_COD) {
        throw new Error('Seul le paiement à la livraison est accepté pour le moment');
      }
      return true;
    }),
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
    const ordersWithImageUrls = orders.map(mapOrderImages);

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

// @route   GET /api/orders/stats/summary
// @desc    Obtenir les statistiques des commandes
// @access  Private (Admin)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

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
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] } },
          confirmedOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'confirmed'] }, 1, 0] } },
          shippedOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped'] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } },
        },
      },
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    };

    res.json({
      period,
      startDate,
      endDate: new Date(),
      stats: result,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
});

// @route   GET /api/orders/track/:reference
// @desc    Suivi par numéro de commande ou code colis Fiabilo (un seul champ)
// @access  Public (rate limited)
router.get('/track/:reference', guestOrderLimiter, async (req, res) => {
  try {
    const reference = String(req.params.reference || '').trim();

    if (!reference) {
      return res.status(400).json({
        message: 'Numéro de commande ou code colis requis.',
      });
    }

    const live = req.query.live === '1' || req.query.live === 'true';

    const order = await Order.findOne({
      $or: [
        { orderNumber: reference },
        { 'fiabilo.trackingCode': reference },
      ],
    })
      .populate('items.product', 'name images slug')
      .lean();

    if (order) {
      const trackingInfo = await attachFiabiloTrackingToOrder(order, { live });
      const mappedOrder = mapOrderImages(order);

      return res.json({
        order: {
          ...mappedOrder,
          ...trackingInfo,
        },
        trackingOnly: false,
      });
    }

    if (/^\d{8,20}$/.test(reference)) {
      const { trackFiabiloShipment } = require('../services/fiabiloService');
      try {
        const fiabiloTracking = await trackFiabiloShipment(reference);
        return res.json({
          order: null,
          trackingOnly: true,
          trackingCode: reference,
          fiabiloTracking,
        });
      } catch (error) {
        return res.status(404).json({
          message: 'Colis non trouvé. Vérifiez le code colis Fiabilo.',
        });
      }
    }

    return res.status(404).json({
      message: 'Commande ou colis non trouvé. Vérifiez le numéro saisi.',
    });
  } catch (error) {
    console.error('Erreur lors du suivi commande:', error);
    res.status(500).json({
      message: 'Erreur lors du suivi de la commande',
    });
  }
});

// @route   GET /api/orders/guest/:orderNumber/:phone
// @desc    Obtenir une commande invité par numéro et téléphone
// @access  Public (rate limited)
router.get('/guest/:orderNumber/:phone', guestOrderLimiter, async (req, res) => {
  try {
    const orderNumber = String(req.params.orderNumber || '').trim();
    const phone = normalizeGuestPhone(req.params.phone);

    if (!orderNumber || !phone) {
      return res.status(400).json({
        message: 'Numéro de commande et téléphone requis.',
      });
    }

    const order = await Order.findOne({
      orderNumber,
      guestEmail: phone,
    })
      .populate('items.product', 'name images slug')
      .lean();

    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée. Vérifiez le numéro de commande et le téléphone.',
      });
    }

    const live = req.query.live === '1' || req.query.live === 'true';
    const trackingInfo = await attachFiabiloTrackingToOrder(order, { live });
    const mappedOrder = mapOrderImages(order);

    res.json({
      order: {
        ...mappedOrder,
        ...trackingInfo,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande invité:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la commande',
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
        message: 'Commande non trouvée',
      });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({
        message: 'Accès refusé',
      });
    }

    res.json({ order: mapOrderImages(order) });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la commande',
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
        message: 'Commande non trouvée',
      });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({
        message: 'Accès refusé',
      });
    }

    res.json({ order: mapOrderImages(order) });

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
router.post(
  '/',
  orderCreateBurstLimiter,
  orderCreateLimiter,
  orderEmailLimiter,
  orderPhoneLimiter,
  optionalAuth,
  orderValidation,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    req.body.paymentMethod = PAYMENT_METHOD_COD;
    const order = await processOrder(req.body, req.user ? req.user._id : null);

    res.status(201).json({
      message: 'Commande créée avec succès',
      order,
    });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
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

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = { ...order.notes, admin: notes };

    if (orderStatus === 'delivered') {
      order.markAsDelivered();
    }

    if (orderStatus === 'cancelled') {
      order.cancelOrder('Annulée par l\'administrateur', req.user._id);
    }

    if (orderStatus === 'confirmed' && !order.stockDeducted) {
      try {
        await deductOrderStock(order);
        order.stockDeducted = true;
      } catch (stockError) {
        return res.status(400).json({
          message: stockError.message || 'Stock insuffisant pour confirmer la commande',
        });
      }
    }

    if (orderStatus === 'cancelled' && order.stockDeducted) {
      await restoreOrderStock(order);
      order.stockDeducted = false;
    }

    await order.save();

    res.json({
      message: 'Statut de la commande mis à jour avec succès',
      order: {
        ...order.toObject(),
        items: order.items.map(item => ({
          ...item,
          image: getImageUrl(item.image),
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
    if (req.user.role !== 'admin') {
      if (!order.user || order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Accès refusé',
        });
      }
    }

    // Vérifier que la commande peut être annulée
    if (['delivered', 'cancelled', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: 'Cette commande ne peut pas être annulée'
      });
    }

    // Annuler la commande
    order.cancelOrder(reason || 'Annulée par le client', req.user._id);

    if (order.stockDeducted) {
      await restoreOrderStock(order);
      order.stockDeducted = false;
    }

    await order.save();

    res.json({
      message: 'Commande annulée avec succès',
      order: {
        ...order.toObject(),
        items: order.items.map(item => ({
          ...item,
          image: getImageUrl(item.image),
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

module.exports = router;
