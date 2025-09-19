const express = require('express');
const router = express.Router();
const AdminRequest = require('../models/AdminRequest');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   POST /api/admin-requests
// @desc    Créer une demande d'administration
// @access  Private (utilisateur connecté)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reason, phone } = req.body;
    const userId = req.user._id;

    // Vérifier si l'utilisateur a déjà une demande en attente
    const existingRequest = await AdminRequest.findOne({
      user: userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà une demande d\'administration en attente'
      });
    }

    // Vérifier si l'utilisateur est déjà admin
    const user = await User.findById(userId);
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà administrateur'
      });
    }

    // Créer la demande
    const adminRequest = new AdminRequest({
      user: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: phone || user.phone,
      reason
    });

    await adminRequest.save();

    res.status(201).json({
      success: true,
      message: 'Demande d\'administration envoyée avec succès',
      data: adminRequest
    });

  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la demande'
    });
  }
});

// @route   GET /api/admin-requests
// @desc    Récupérer toutes les demandes d'administration
// @access  Private (admin seulement)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const adminRequests = await AdminRequest.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdminRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        requests: adminRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des demandes'
    });
  }
});

// @route   GET /api/admin-requests/:id
// @desc    Récupérer une demande d'administration spécifique
// @access  Private (admin seulement)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const adminRequest = await AdminRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email phone createdAt')
      .populate('reviewedBy', 'firstName lastName email');

    if (!adminRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande d\'administration non trouvée'
      });
    }

    res.json({
      success: true,
      data: adminRequest
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la demande'
    });
  }
});

// @route   PUT /api/admin-requests/:id/approve
// @desc    Approuver une demande d'administration
// @access  Private (admin seulement)
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    const adminId = req.user._id;

    const adminRequest = await AdminRequest.findById(req.params.id);
    if (!adminRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande d\'administration non trouvée'
      });
    }

    if (adminRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Mettre à jour la demande
    adminRequest.status = 'approved';
    adminRequest.reviewedBy = adminId;
    adminRequest.reviewedAt = new Date();
    adminRequest.reviewNotes = reviewNotes;

    await adminRequest.save();

    // Mettre à jour le rôle de l'utilisateur
    await User.findByIdAndUpdate(adminRequest.user, {
      role: 'admin'
    });

    res.json({
      success: true,
      message: 'Demande d\'administration approuvée avec succès',
      data: adminRequest
    });

  } catch (error) {
    console.error('Erreur lors de l\'approbation de la demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'approbation de la demande'
    });
  }
});

// @route   PUT /api/admin-requests/:id/reject
// @desc    Rejeter une demande d'administration
// @access  Private (admin seulement)
router.put('/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    const adminId = req.user._id;

    const adminRequest = await AdminRequest.findById(req.params.id);
    if (!adminRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande d\'administration non trouvée'
      });
    }

    if (adminRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Mettre à jour la demande
    adminRequest.status = 'rejected';
    adminRequest.reviewedBy = adminId;
    adminRequest.reviewedAt = new Date();
    adminRequest.reviewNotes = reviewNotes;

    await adminRequest.save();

    res.json({
      success: true,
      message: 'Demande d\'administration rejetée',
      data: adminRequest
    });

  } catch (error) {
    console.error('Erreur lors du rejet de la demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du rejet de la demande'
    });
  }
});

// @route   GET /api/admin-requests/user/status
// @desc    Vérifier le statut de la demande de l'utilisateur connecté
// @access  Private
router.get('/user/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const adminRequest = await AdminRequest.findOne({ user: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        hasRequest: !!adminRequest,
        request: adminRequest
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du statut'
    });
  }
});

module.exports = router;
