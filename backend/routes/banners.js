const express = require('express');
const { body, validationResult } = require('express-validator');
const Banner = require('../models/Banner');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadBannerImages, uploadBuffersToCloudinary, handleUploadError, deleteFile, getImageUrl, isExistingOrCloudinary } = require('../middleware/upload');
const publicCache = require('../middleware/publicCache');
const { publishCatalogUpdate } = require('../services/catalogRealtime');

const router = express.Router();

const parseBoolean = (value, defaultValue = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() !== 'false';
  return defaultValue;
};

const extractBannerImages = (req) => {
  let image = '';
  let mobileImage = '';

  if (req.uploadedImages && req.uploadedImages.length > 0) {
    const imgObj = req.uploadedImages.find(u => u.fieldname === 'image');
    const mobObj = req.uploadedImages.find(u => u.fieldname === 'mobileImage');
    if (imgObj) image = imgObj.url;
    if (mobObj) mobileImage = mobObj.url;
  }

  if (req.files) {
    if (!image && req.files.image && req.files.image[0]) {
      image = req.files.image[0].filename;
    }
    if (!mobileImage && req.files.mobileImage && req.files.mobileImage[0]) {
      mobileImage = req.files.mobileImage[0].filename;
    }
  }

  if (!image && req.file) {
    image = req.file.filename;
  }

  return { image, mobileImage };
};

router.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  res.once('finish', () => {
    if (res.statusCode < 400) publishCatalogUpdate('banners');
  });
  return next();
});

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
  body('collectionBadgeText')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le texte du cadre ne peut pas dépasser 100 caractères'),
  body('brandTitle')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le titre ne peut pas dépasser 100 caractères'),
  body(['showCollectionBadge', 'showBrandTitle', 'showButton'])
    .optional()
    .isBoolean()
    .withMessage('Les options d’affichage doivent être des booléens'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('L\'ordre doit être un nombre entier positif')
];

// @route   GET /api/banners
// @desc    Obtenir toutes les bannières (admin) ou actives (public)
// @access  Public pour les actives, Admin pour toutes
router.get('/', publicCache(300), optionalAuth, async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    let banners;

    if (includeInactive === 'true') {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Accès refusé. Droits administrateur requis.'
        });
      }
      banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    } else {
      banners = await Banner.getActiveBanners();
    }

    const isAdmin = includeInactive === 'true';
    if (!isAdmin) {
      banners = banners.filter(b => isExistingOrCloudinary(b.image));
    }

    // Ajouter les URLs d'images et nettoyer les références locales orphelines pour le public
    const bannersWithUrls = banners.map(banner => {
      const mobileValid = isExistingOrCloudinary(banner.mobileImage);
      return {
        ...banner.toObject(),
        image: getImageUrl(banner.image),
        mobileImage: isAdmin
          ? (banner.mobileImage ? getImageUrl(banner.mobileImage) : null)
          : (mobileValid ? getImageUrl(banner.mobileImage) : null),
        imageMissing: !isExistingOrCloudinary(banner.image),
        mobileImageMissing: banner.mobileImage ? !mobileValid : false
      };
    });

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
        image: getImageUrl(banner.image),
        mobileImage: banner.mobileImage ? getImageUrl(banner.mobileImage) : null
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
router.post('/', authenticateToken, requireAdmin, uploadBannerImages, uploadBuffersToCloudinary, handleUploadError, bannerValidation, async (req, res) => {
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
      showCollectionBadge,
      collectionBadgeText,
      showBrandTitle,
      brandTitle,
      showButton,
      order,
      isActive,
      startDate,
      endDate,
      backgroundColor,
      textColor,
      position
    } = req.body;

    const { image, mobileImage } = extractBannerImages(req);

    if (!image) {
      return res.status(400).json({
        message: 'Une image est requise'
      });
    }

    const banner = new Banner({
      title,
      subtitle,
      description,
      image,
      mobileImage: mobileImage || null,
      buttonText: buttonText || 'Voir les offres',
      buttonLink: buttonLink || '/boutique',
      showCollectionBadge: parseBoolean(showCollectionBadge),
      collectionBadgeText: collectionBadgeText || '✨ NOUVELLE COLLECTION ✨',
      showBrandTitle: parseBoolean(showBrandTitle),
      brandTitle: brandTitle || 'DELTA FASHION',
      showButton: parseBoolean(showButton),
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
        image: getImageUrl(banner.image),
        mobileImage: banner.mobileImage ? getImageUrl(banner.mobileImage) : null
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
router.put('/:id', authenticateToken, requireAdmin, uploadBannerImages, uploadBuffersToCloudinary, handleUploadError, bannerValidation, async (req, res) => {
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
      showCollectionBadge,
      collectionBadgeText,
      showBrandTitle,
      brandTitle,
      showButton,
      order,
      isActive,
      startDate,
      endDate,
      backgroundColor,
      textColor,
      position,
      removeMobileImage
    } = req.body;

    const { image: newImage, mobileImage: newMobileImage } = extractBannerImages(req);

    // Traiter la nouvelle image bureau si fournie
    if (newImage) {
      if (banner.image) {
        deleteFile(banner.image);
      }
      banner.image = newImage;
    }

    // Traiter la nouvelle image mobile si fournie
    if (newMobileImage) {
      if (banner.mobileImage) {
        deleteFile(banner.mobileImage);
      }
      banner.mobileImage = newMobileImage;
    } else if (removeMobileImage === 'true') {
      if (banner.mobileImage) {
        deleteFile(banner.mobileImage);
      }
      banner.mobileImage = null;
    }

    // Mettre à jour les champs
    if (title) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (description !== undefined) banner.description = description;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (showCollectionBadge !== undefined) banner.showCollectionBadge = parseBoolean(showCollectionBadge);
    if (collectionBadgeText !== undefined) banner.collectionBadgeText = collectionBadgeText;
    if (showBrandTitle !== undefined) banner.showBrandTitle = parseBoolean(showBrandTitle);
    if (brandTitle !== undefined) banner.brandTitle = brandTitle;
    if (showButton !== undefined) banner.showButton = parseBoolean(showButton);
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
        image: getImageUrl(banner.image),
        mobileImage: banner.mobileImage ? getImageUrl(banner.mobileImage) : null
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

    // Supprimer les images
    if (banner.image) {
      deleteFile(banner.image);
    }
    if (banner.mobileImage) {
      deleteFile(banner.mobileImage);
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
        image: getImageUrl(banner.image),
        mobileImage: banner.mobileImage ? getImageUrl(banner.mobileImage) : null
      }
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      message: 'Erreur lors du changement de statut'
    });
  }
});

// @route   POST /api/banners/migrate-to-cloud
// @desc    Migrer les images locales vers Cloudinary
// @access  Private (Admin)
router.post('/migrate-to-cloud', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { cloudinary: cld, enabled: cloudEnabled, getCloudinaryFolder } = require('../config/cloudinary');
    if (!cloudEnabled || !cld) {
      return res.status(400).json({ message: 'Cloudinary non configuré' });
    }

    const banners = await Banner.find();
    const results = [];

    for (const banner of banners) {
      const fields = ['image', 'mobileImage'];
      let needsSave = false;

      for (const field of fields) {
        const ref = banner[field];
        if (!ref || /^https?:\/\//i.test(ref)) continue;

        const uploadBase = require('path').join(__dirname, '..', process.env.UPLOAD_PATH || '../uploads');
        const filePath = require('path').join(uploadBase, ref);
        const fs = require('fs');

        if (!fs.existsSync(filePath)) {
          results.push({ id: banner._id, field, status: 'file_missing', ref });
          continue;
        }

        try {
          const folder = getCloudinaryFolder();
          const result = await cld.uploader.upload(filePath, {
            folder,
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto',
          });
          banner[field] = result.secure_url;
          needsSave = true;
          results.push({ id: banner._id, field, status: 'migrated', url: result.secure_url });
        } catch (err) {
          results.push({ id: banner._id, field, status: 'error', error: err.message });
        }
      }

      if (needsSave) await banner.save();
    }

    res.json({ message: 'Migration terminée', results });
  } catch (error) {
    console.error('Erreur migration bannières:', error);
    res.status(500).json({ message: 'Erreur lors de la migration' });
  }
});

// Auto-migration: migrate local banner images to Cloudinary on server startup
const autoMigrateLocalBanners = async () => {
  try {
    const { cloudinary: cld, enabled: cloudEnabled, getCloudinaryFolder } = require('../config/cloudinary');
    if (!cloudEnabled || !cld) return;

    const fs = require('fs');
    const pathMod = require('path');

    const banners = await Banner.find();
    let migratedCount = 0;

    for (const banner of banners) {
      let needsSave = false;

      for (const field of ['image', 'mobileImage']) {
        const ref = banner[field];
        if (!ref || /^https?:\/\//i.test(ref)) continue;

        const uploadBase = pathMod.join(__dirname, '..', process.env.UPLOAD_PATH || '../uploads');
        const filePath = pathMod.join(uploadBase, ref);

        if (!fs.existsSync(filePath)) continue;

        try {
          const folder = getCloudinaryFolder();
          const result = await cld.uploader.upload(filePath, {
            folder,
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto',
          });
          banner[field] = result.secure_url;
          needsSave = true;
          console.log(`🔄 Banner "${banner.title}" ${field}: migré local → Cloudinary`);
        } catch (err) {
          console.warn(`⚠️  Banner "${banner.title}" ${field}: échec migration Cloudinary:`, err.message);
        }
      }

      if (needsSave) {
        await banner.save();
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`✅ Auto-migration: ${migratedCount} bannière(s) migrée(s) vers Cloudinary`);
    }
  } catch (err) {
    console.warn('⚠️  Auto-migration bannières échouée (non bloquant):', err.message);
  }
};

module.exports = router;
module.exports.autoMigrateLocalBanners = autoMigrateLocalBanners;
