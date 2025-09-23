const express = require('express');
const { body, validationResult } = require('express-validator');
const Banner = require('../models/Banner');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadSingleImage, uploadBuffersToCloudinary, handleUploadError, deleteFile, getImageUrl } = require('../middleware/upload');

const router = express.Router();

// Validation pour les bannières
const bannerValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le titre doit contenir entre 2 et 100 caractères'),
  body('subtitle')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Le sous-titre ne peut pas dépasser 200 caractères'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  body('buttonText')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le texte du bouton ne peut pas dépasser 50 caractères'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('L\'ordre doit être un nombre entier positif')
];

// @route   GET /api/banners
// @desc    Obtenir toutes les bannières (admin) ou actives (public)
// @access  Public pour les actives, Admin pour toutes
router.get('/', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    let banners;

    if (includeInactive === 'true') {
      // Admin: toutes les bannières
      banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    } else {
      // Public: seulement les bannières actives
      banners = await Banner.getActiveBanners();
    }

    // Ajouter les URLs d'images
    const bannersWithUrls = banners.map(banner => ({
      ...banner.toObject(),
      image: getImageUrl(banner.image)
    }));

    res.json({ banners: bannersWithUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération des bannières:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des bannières'
    });
  }
});

// @route   GET /api/banners/:id
// @desc    Obtenir une bannière par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        message: 'Bannière non trouvée'
      });
    }

    res.json({
      banner: {
        ...banner.toObject(),
        image: getImageUrl(banner.image)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la bannière:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la bannière'
    });
  }
});

// @route   POST /api/banners
// @desc    Créer une nouvelle bannière
// @access  Private (Admin)
router.post('/', authenticateToken, requireAdmin, uploadSingleImage, uploadBuffersToCloudinary, handleUploadError, bannerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      order,
      isActive,
      startDate,
      endDate,
      backgroundColor,
      textColor,
      position
    } = req.body;

    // Traiter l'image uploadée (Cloudinary ou local)
    let image = '';
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      // Image uploadée sur Cloudinary
      image = req.uploadedImages[0].url;
    } else if (req.file) {
      // Image uploadée localement (fallback)
      image = req.file.filename;
    } else {
      return res.status(400).json({
        message: 'Une image est requise'
      });
    }

    const banner = new Banner({
      title,
      subtitle,
      description,
      image,
      buttonText: buttonText || 'Voir les offres',
      buttonLink: buttonLink || '/boutique',
      order: order ? parseInt(order) : 0,
      isActive: isActive !== 'false',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      backgroundColor: backgroundColor || '#f8f9fa',
      textColor: textColor || '#ffffff',
      position: position || 'center'
    });

    await banner.save();

    res.status(201).json({
      message: 'Bannière créée avec succès',
      banner: {
        ...banner.toObject(),
        image: getImageUrl(banner.image)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la bannière:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la bannière'
    });
  }
});

// @route   PUT /api/banners/:id
// @desc    Mettre à jour une bannière
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireAdmin, uploadSingleImage, uploadBuffersToCloudinary, handleUploadError, bannerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        message: 'Bannière non trouvée'
      });
    }

    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      order,
      isActive,
      startDate,
      endDate,
      backgroundColor,
      textColor,
      position
    } = req.body;

    // Traiter la nouvelle image si fournie (Cloudinary ou local)
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      // Supprimer l'ancienne image
      if (banner.image) {
        deleteFile(banner.image);
      }
      // Image uploadée sur Cloudinary
      banner.image = req.uploadedImages[0].url;
    } else if (req.file) {
      // Supprimer l'ancienne image
      if (banner.image) {
        deleteFile(banner.image);
      }
      // Image uploadée localement (fallback)
      banner.image = req.file.filename;
    }

    // Mettre à jour les champs
    if (title) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (description !== undefined) banner.description = description;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (order !== undefined) banner.order = parseInt(order);
    if (isActive !== undefined) banner.isActive = isActive === 'true';
    if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : new Date();
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;
    if (backgroundColor !== undefined) banner.backgroundColor = backgroundColor;
    if (textColor !== undefined) banner.textColor = textColor;
    if (position !== undefined) banner.position = position;

    await banner.save();

    res.json({
      message: 'Bannière mise à jour avec succès',
      banner: {
        ...banner.toObject(),
        image: getImageUrl(banner.image)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la bannière:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la bannière'
    });
  }
});

// @route   DELETE /api/banners/:id
// @desc    Supprimer une bannière
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        message: 'Bannière non trouvée'
      });
    }

    // Supprimer l'image
    if (banner.image) {
      deleteFile(banner.image);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Bannière supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la bannière:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la bannière'
    });
  }
});

// @route   PUT /api/banners/:id/toggle
// @desc    Activer/désactiver une bannière
// @access  Private (Admin)
router.put('/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        message: 'Bannière non trouvée'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      message: `Bannière ${banner.isActive ? 'activée' : 'désactivée'} avec succès`,
      banner: {
        ...banner.toObject(),
        image: getImageUrl(banner.image)
      }
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      message: 'Erreur lors du changement de statut'
    });
  }
});

module.exports = router;
