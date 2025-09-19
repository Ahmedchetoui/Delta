const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const { uploadAvatar, handleUploadError, deleteFile, getImageUrl } = require('../middleware/upload');

const router = express.Router();

// Validation pour la mise à jour d'utilisateur
const userUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Numéro de téléphone invalide'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Rôle invalide')
];

// @route   GET /api/users
// @desc    Obtenir tous les utilisateurs (admin) ou profil utilisateur
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite invalide'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Rôle invalide'),
  query('isActive').optional().isBoolean().withMessage('Statut actif invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    // Si l'utilisateur n'est pas admin, retourner seulement son profil
    if (req.user.role !== 'admin') {
      return res.json({
        users: [req.user]
      });
    }

    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search
    } = req.query;

    // Construire le filtre
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    // Ajouter les URLs d'avatars
    const usersWithAvatars = users.map(user => ({
      ...user,
      avatar: user.avatar ? getImageUrl(user.avatar) : null
    }));

    res.json({
      users: usersWithAvatars,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obtenir un utilisateur par ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que l'utilisateur peut accéder à ce profil
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    // Ajouter l'URL de l'avatar
    const userWithAvatar = {
      ...user,
      avatar: user.avatar ? getImageUrl(user.avatar) : null
    };

    res.json({ user: userWithAvatar });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Private
router.put('/:id', authenticateToken, requireOwnerOrAdmin, uploadAvatar, handleUploadError, userUpdateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    const {
      firstName,
      lastName,
      phone,
      address,
      role,
      isActive
    } = req.body;

    // Traiter la nouvelle image si fournie
    if (req.file) {
      // Supprimer l'ancienne image
      if (user.avatar) {
        deleteFile(user.avatar);
      }
      user.avatar = req.file.filename;
    }

    // Mettre à jour les champs
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;

    // Seuls les admins peuvent modifier le rôle et le statut actif
    if (req.user.role === 'admin') {
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive === 'true';
    }

    await user.save();

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: {
        ...user.toObject(),
        avatar: user.avatar ? getImageUrl(user.avatar) : null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier qu'on ne supprime pas le dernier admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Impossible de supprimer le dernier administrateur'
        });
      }
    }

    // Vérifier s'il y a des commandes associées
    const orderCount = await Order.countDocuments({ user: user._id });
    if (orderCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer un utilisateur qui a des commandes'
      });
    }

    // Supprimer l'avatar
    if (user.avatar) {
      deleteFile(user.avatar);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
});

// @route   GET /api/users/:id/orders
// @desc    Obtenir les commandes d'un utilisateur
// @access  Private
router.get('/:id/orders', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    // Vérifier que l'utilisateur peut accéder à ces commandes
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.params.id })
        .populate('items.product', 'name images slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments({ user: req.params.id })
    ]);

    // Ajouter les URLs d'images aux produits
    const ordersWithImageUrls = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        image: item.image ? `http://localhost:5000/uploads/${item.image}` : null
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
    console.error('Erreur lors de la récupération des commandes de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des commandes de l\'utilisateur'
    });
  }
});

// @route   GET /api/users/:id/wishlist
// @desc    Obtenir la wishlist d'un utilisateur
// @access  Private
router.get('/:id/wishlist', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur peut accéder à cette wishlist
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    const user = await User.findById(req.params.id).populate({
      path: 'wishlist',
      match: { isActive: true },
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Ajouter les URLs d'images
    const wishlistWithUrls = user.wishlist.map(product => ({
      ...product.toObject(),
      images: product.images.map(image => getImageUrl(image))
    }));

    res.json({ wishlist: wishlistWithUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération de la wishlist:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la wishlist'
    });
  }
});

// @route   POST /api/users/:id/wishlist/:productId
// @desc    Ajouter un produit à la wishlist
// @access  Private
router.post('/:id/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur peut modifier cette wishlist
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    const product = await Product.findById(req.params.productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    // Vérifier si le produit est déjà dans la wishlist
    if (user.wishlist.includes(product._id)) {
      return res.status(400).json({
        message: 'Produit déjà dans la wishlist'
      });
    }

    user.wishlist.push(product._id);
    await user.save();

    res.json({
      message: 'Produit ajouté à la wishlist avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout à la wishlist:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout à la wishlist'
    });
  }
});

// @route   DELETE /api/users/:id/wishlist/:productId
// @desc    Supprimer un produit de la wishlist
// @access  Private
router.delete('/:id/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur peut modifier cette wishlist
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: 'Accès refusé'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si le produit est dans la wishlist
    if (!user.wishlist.includes(req.params.productId)) {
      return res.status(400).json({
        message: 'Produit non trouvé dans la wishlist'
      });
    }

    user.wishlist = user.wishlist.filter(
      productId => productId.toString() !== req.params.productId
    );
    await user.save();

    res.json({
      message: 'Produit supprimé de la wishlist avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la wishlist:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la wishlist'
    });
  }
});

// @route   GET /api/users/stats/summary
// @desc    Obtenir les statistiques des utilisateurs
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

    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          newUsers: {
            $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      newUsers: 0
    };

    res.json({
      period,
      startDate,
      endDate: new Date(),
      stats: result
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des utilisateurs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques des utilisateurs'
    });
  }
});

module.exports = router;
