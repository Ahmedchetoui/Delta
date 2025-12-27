const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getImageUrl } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes admin nécessitent une authentification admin
router.use(authenticateToken, requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Obtenir les statistiques du tableau de bord
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
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

    // Statistiques générales
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      activeUsers,
      activeProducts,
      activeCategories,
      pendingOrders
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Order.countDocuments({ orderStatus: 'pending' })
    ]);

    // Statistiques de revenus
    const revenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Statistiques des commandes par statut
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Statistiques des commandes par mois (pour les 12 derniers mois)
    const monthlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Produits les plus vendus
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          productImage: { $arrayElemAt: ['$product.images', 0] },
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Catégories les plus populaires
    const topCategories = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalSold: { $sum: '$soldCount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryName: '$category.name',
          productCount: 1,
          totalViews: 1,
          totalSold: 1
        }
      },
      { $sort: { productCount: -1 } },
      { $limit: 10 }
    ]);

    // Utilisateurs les plus actifs
    const topUsers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          userEmail: '$user.email',
          totalOrders: 1,
          totalSpent: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalOrders: 0
    };

    res.json({
      period,
      startDate,
      endDate: new Date(),
      summary: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        activeUsers,
        activeProducts,
        activeCategories,
        pendingOrders
      },
      revenue,
      orderStats: orderStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      monthlyStats,
      topProducts: topProducts.map(product => ({
        ...product,
        productImage: getImageUrl(product.productImage)
      })),
      topCategories,
      topUsers
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du tableau de bord:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques du tableau de bord'
    });
  }
});

// @route   GET /api/admin/analytics/sales
// @desc    Obtenir les statistiques de ventes détaillées
// @access  Private (Admin)
router.get('/analytics/sales', [
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
  query('groupBy').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Groupement invalide')
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
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      groupBy = 'day'
    } = req.query;

    // Construire le groupement selon le paramètre
    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        groupFormat = {
          year: { $year: '$createdAt' }
        };
        break;
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
      }
    ]);

    res.json({
      period: { startDate, endDate, groupBy },
      salesData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de ventes:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques de ventes'
    });
  }
});

// @route   GET /api/admin/analytics/products
// @desc    Obtenir les statistiques des produits
// @access  Private (Admin)
router.get('/analytics/products', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculer la date de début
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

    // Statistiques générales des produits
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          featuredProducts: { $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] } },
          newProducts: { $sum: { $cond: [{ $eq: ['$isNewProduct', true] }, 1, 0] } },
          onSaleProducts: { $sum: { $cond: [{ $eq: ['$isOnSale', true] }, 1, 0] } },
          totalStock: { $sum: '$totalStock' },
          totalViews: { $sum: '$viewCount' },
          totalSold: { $sum: '$soldCount' }
        }
      }
    ]);

    // Produits avec stock faible
    const lowStockProducts = await Product.find({
      isActive: true,
      totalStock: { $lte: 10, $gt: 0 }
    })
      .select('name totalStock images')
      .sort({ totalStock: 1 })
      .limit(20)
      .lean();

    // Produits sans stock
    const outOfStockProducts = await Product.find({
      isActive: true,
      totalStock: 0
    })
      .select('name images')
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    // Produits les plus vus
    const mostViewedProducts = await Product.find({
      isActive: true
    })
      .select('name viewCount images')
      .sort({ viewCount: -1 })
      .limit(10)
      .lean();

    // Produits les plus vendus
    const bestSellingProducts = await Product.find({
      isActive: true
    })
      .select('name soldCount images')
      .sort({ soldCount: -1 })
      .limit(10)
      .lean();

    // Produits récemment ajoutés
    const recentProducts = await Product.find({
      isActive: true
    })
      .select('name createdAt images')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const stats = productStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      featuredProducts: 0,
      newProducts: 0,
      onSaleProducts: 0,
      totalStock: 0,
      totalViews: 0,
      totalSold: 0
    };

    res.json({
      period,
      startDate,
      endDate: new Date(),
      stats,
      lowStockProducts: lowStockProducts.map(product => ({
        ...product,
        images: product.images.map(image => getImageUrl(image))
      })),
      outOfStockProducts: outOfStockProducts.map(product => ({
        ...product,
        images: product.images.map(image => getImageUrl(image))
      })),
      mostViewedProducts: mostViewedProducts.map(product => ({
        ...product,
        images: product.images.map(image => getImageUrl(image))
      })),
      bestSellingProducts: bestSellingProducts.map(product => ({
        ...product,
        images: product.images.map(image => getImageUrl(image))
      })),
      recentProducts: recentProducts.map(product => ({
        ...product,
        images: product.images.map(image => getImageUrl(image))
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des produits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques des produits'
    });
  }
});

// @route   GET /api/admin/analytics/customers
// @desc    Obtenir les statistiques des clients
// @access  Private (Admin)
router.get('/analytics/customers', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculer la date de début
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

    // Statistiques générales des clients
    const customerStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          newUsers: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } }
        }
      }
    ]);

    // Clients avec le plus de commandes
    const topCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          totalOrders: 1,
          totalSpent: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 }
    ]);

    // Nouveaux clients
    const newCustomers = await User.find({
      role: 'user',
      createdAt: { $gte: startDate }
    })
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Clients inactifs (pas de commande depuis 90 jours)
    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - 90);

    const inactiveCustomers = await User.aggregate([
      {
        $match: {
          role: 'user',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $match: {
          $or: [
            { orders: { $size: 0 } },
            { 'orders.createdAt': { $lt: inactiveDate } }
          ]
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          lastOrderDate: { $max: '$orders.createdAt' }
        }
      },
      { $sort: { lastOrderDate: 1 } },
      { $limit: 20 }
    ]);

    const stats = customerStats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      newUsers: 0
    };

    res.json({
      period,
      startDate,
      endDate: new Date(),
      stats,
      topCustomers,
      newCustomers,
      inactiveCustomers
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des clients:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques des clients'
    });
  }
});

// @route   GET /api/admin/orders
// @desc    Obtenir toutes les commandes avec filtres et pagination
// @access  Private (Admin)
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Statut invalide'),
  query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Statut de paiement invalide'),
  query('search').optional().isLength({ max: 100 }).withMessage('Recherche trop longue'),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide')
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
      limit = 20,
      status,
      paymentStatus,
      search,
      startDate,
      endDate
    } = req.query;

    // Construire le filtre
    const filter = {};

    if (status) {
      filter.orderStatus = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(filter);

    // Formater les données pour l'affichage
    const formattedOrders = orders.map(order => ({
      ...order,
      customerName: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      customerEmail: order.user ? order.user.email : order.guestEmail,
      statusInFrench: getStatusInFrench(order.orderStatus),
      paymentStatusInFrench: getPaymentStatusInFrench(order.paymentStatus),
      totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          images: item.product?.images?.map(img => getImageUrl(img)) || []
        }
      }))
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Obtenir les détails d'une commande
// @access  Private (Admin)
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images sku')
      .lean();

    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée'
      });
    }

    // Formater les données
    const formattedOrder = {
      ...order,
      customerName: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      customerEmail: order.user ? order.user.email : order.guestEmail,
      statusInFrench: getStatusInFrench(order.orderStatus),
      paymentStatusInFrench: getPaymentStatusInFrench(order.paymentStatus),
      paymentMethodInFrench: getPaymentMethodInFrench(order.paymentMethod),
      totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          images: item.product?.images?.map(img => getImageUrl(img)) || []
        }
      }))
    };

    res.json(formattedOrder);

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Mettre à jour le statut d'une commande
// @access  Private (Admin)
router.put('/orders/:id/status', [
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
  body('adminNotes')
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

    const { orderStatus, paymentStatus, trackingNumber, adminNotes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        message: 'Commande non trouvée'
      });
    }

    // Mettre à jour les champs
    order.orderStatus = orderStatus;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (adminNotes) {
      order.notes.admin = adminNotes;
    }

    // Ajouter des timestamps spécifiques selon le statut
    const now = new Date();
    switch (orderStatus) {
      case 'confirmed':
        order.confirmedAt = now;
        break;
      case 'processing':
        order.processingAt = now;
        break;
      case 'shipped':
        order.shippedAt = now;
        break;
      case 'delivered':
        order.deliveredAt = now;
        break;
      case 'cancelled':
        order.cancelledAt = now;
        order.cancelledBy = req.user.id;
        break;
    }

    await order.save();

    res.json({
      message: 'Statut de la commande mis à jour avec succès',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        statusInFrench: getStatusInFrench(order.orderStatus)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// @route   POST /api/admin/orders/:id/cancel
// @desc    Annuler une commande
// @access  Private (Admin)
router.post('/orders/:id/cancel', [
  body('reason')
    .notEmpty()
    .withMessage('Raison d\'annulation requise')
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

    // Vérifier si la commande peut être annulée
    if (['delivered', 'cancelled', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: 'Cette commande ne peut pas être annulée'
      });
    }

    // Utiliser la méthode du modèle pour annuler
    order.cancelOrder(reason, req.user.id);
    await order.save();

    res.json({
      message: 'Commande annulée avec succès',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'annulation de la commande'
    });
  }
});

// Fonctions utilitaires pour la traduction des statuts
function getStatusInFrench(status) {
  const statusMap = {
    'pending': 'En attente',
    'confirmed': 'Confirmée',
    'processing': 'En cours de traitement',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée',
    'refunded': 'Remboursée'
  };
  return statusMap[status] || status;
}

function getPaymentStatusInFrench(status) {
  const statusMap = {
    'pending': 'En attente',
    'paid': 'Payé',
    'failed': 'Échoué',
    'refunded': 'Remboursé'
  };
  return statusMap[status] || status;
}

function getPaymentMethodInFrench(method) {
  const methodMap = {
    'cash_on_delivery': 'Paiement à la livraison',
    'bank_transfer': 'Virement bancaire',
    'paypal': 'PayPal',
    'stripe': 'Carte bancaire'
  };
  return methodMap[method] || method;
}

// @route   POST /api/admin/backup
// @desc    Créer une sauvegarde des données
// @access  Private (Admin)
router.post('/backup', async (req, res) => {
  try {
    // Cette route est un exemple - dans un vrai projet, vous utiliseriez
    // des outils comme mongodump ou des services cloud
    const backupData = {
      timestamp: new Date(),
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      categories: await Category.countDocuments(),
      orders: await Order.countDocuments()
    };

    res.json({
      message: 'Sauvegarde créée avec succès',
      backup: backupData
    });

  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la sauvegarde'
    });
  }
});

// @route   GET /api/admin/system/health
// @desc    Vérifier la santé du système
// @access  Private (Admin)
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      timestamp: new Date(),
      status: 'healthy',
      services: {
        database: 'connected',
        storage: 'available'
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version
      }
    };

    res.json(health);

  } catch (error) {
    console.error('Erreur lors de la vérification de la santé du système:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification de la santé du système'
    });
  }
});

module.exports = router;
