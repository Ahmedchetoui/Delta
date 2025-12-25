const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadProductImages, uploadBuffersToCloudinary, handleUploadError, deleteFile, getImageUrl } = require('../middleware/upload');

const router = express.Router();

// Validation pour la création/mise à jour de produit
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  body('category')
    .isMongoId()
    .withMessage('ID de catégorie invalide'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le stock doit être un nombre entier positif')
];

// @route   GET /api/products
// @desc    Obtenir tous les produits avec filtres et pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite invalide'),
  query('category').optional().isMongoId().withMessage('ID de catégorie invalide'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Prix minimum invalide'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Prix maximum invalide'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Recherche invalide'),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'oldest', 'rating', 'popular']).withMessage('Tri invalide')
], optionalAuth, async (req, res) => {
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
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'newest',
      featured,
      onSale,
      inStock
    } = req.query;

    // Construire le filtre
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (onSale === 'true') {
      filter.isOnSale = true;
    }

    if (inStock === 'true') {
      filter.totalStock = { $gt: 0 };
    }

    // Construire le tri
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'rating':
        sortOption = { 'rating.average': -1 };
        break;
      case 'popular':
        sortOption = { soldCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Exécuter la requête
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Ajouter les URLs d'images et le prix final
    const productsWithUrls = products.map(product => ({
      ...product,
      images: product.images.map(image => getImageUrl(image)),
      finalPrice: product.discount > 0 && product.originalPrice
        ? product.originalPrice * (1 - product.discount / 100)
        : product.price
    }));

    res.json({
      products: productsWithUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Obtenir les produits en vedette
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isFeatured: true
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const productsWithUrls = products.map(product => ({
      ...product,
      images: product.images.map(image => getImageUrl(image)),
      finalPrice: product.discount > 0 && product.originalPrice
        ? product.originalPrice * (1 - product.discount / 100)
        : product.price
    }));

    res.json({ products: productsWithUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits en vedette:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits en vedette'
    });
  }
});

// @route   GET /api/products/new
// @desc    Obtenir les nouveaux produits
// @access  Public
router.get('/new', async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isNewProduct: true
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const productsWithUrls = products.map(product => ({
      ...product,
      images: product.images.map(image => getImageUrl(image)),
      finalPrice: product.discount > 0 && product.originalPrice
        ? product.originalPrice * (1 - product.discount / 100)
        : product.price
    }));

    res.json({ products: productsWithUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération des nouveaux produits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des nouveaux produits'
    });
  }
});

// @route   GET /api/products/sale
// @desc    Obtenir les produits en promotion
// @access  Public
router.get('/sale', async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isOnSale: true,
      discount: { $gt: 0 }
    })
      .populate('category', 'name slug')
      .sort({ discount: -1 })
      .limit(8)
      .lean();

    const productsWithUrls = products.map(product => ({
      ...product,
      images: product.images.map(image => getImageUrl(image))
    }));

    res.json({ products: productsWithUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits en promotion:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits en promotion'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Obtenir un produit par ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('reviews.user', 'firstName lastName')
      .lean();

    if (!product || !product.isActive) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    // Incrémenter le compteur de vues
    await Product.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 }
    });

    // Ajouter les URLs d'images et le prix final
    const productWithUrls = {
      ...product,
      images: product.images.map(image => getImageUrl(image)),
      finalPrice: product.discount > 0 && product.originalPrice
        ? product.originalPrice * (1 - product.discount / 100)
        : product.price
    };

    res.json({ product: productWithUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du produit'
    });
  }
});

// @route   GET /api/products/slug/:slug
// @desc    Obtenir un produit par slug
// @access  Public
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true
    })
      .populate('category', 'name slug')
      .populate('reviews.user', 'firstName lastName')
      .lean();

    if (!product) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    // Incrémenter le compteur de vues
    await Product.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { viewCount: 1 } }
    );

    // Ajouter les URLs d'images et le prix final
    const productWithUrls = {
      ...product,
      images: product.images.map(image => getImageUrl(image)),
      finalPrice: product.discount > 0 && product.originalPrice
        ? product.originalPrice * (1 - product.discount / 100)
        : product.price
    };

    res.json({ product: productWithUrls });

  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du produit'
    });
  }
});

// @route   POST /api/products
// @desc    Créer un nouveau produit
// @access  Private (Admin)
router.post('/', authenticateToken, requireAdmin, uploadProductImages, uploadBuffersToCloudinary, handleUploadError, productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      shortDescription,
      price,
      originalPrice,
      discount,
      category,
      subCategory,
      brand,
      sku,
      variants,
      colors,
      sizes,
      isFeatured,
      isNew,
      isOnSale,
      tags,
      weight,
      dimensions,
      freeShipping,
      metaTitle,
      metaDescription
    } = req.body;

    // Vérifier que la catégorie existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        message: 'Catégorie non trouvée'
      });
    }

    // Traiter les images uploadées (Cloudinary si dispo, sinon fichiers locaux)
    const images = req.uploadedImages
      ? req.uploadedImages.map(u => u.url)
      : (req.files ? req.files.map(file => file.filename) : []);

    if (images.length === 0) {
      return res.status(400).json({
        message: 'Au moins une image est requise'
      });
    }

    // Traiter les variantes si fournies
    let processedVariants = [];
    if (variants) {
      try {
        processedVariants = JSON.parse(variants);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de variantes invalide'
        });
      }
    }

    // Traiter les couleurs si fournies
    let processedColors = [];
    if (colors) {
      try {
        processedColors = JSON.parse(colors);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de couleurs invalide'
        });
      }
    }

    // Traiter les tailles si fournies
    let processedSizes = [];
    if (sizes) {
      try {
        processedSizes = JSON.parse(sizes);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de tailles invalide'
        });
      }
    }

    // Traiter les tags si fournis
    let processedTags = [];
    if (tags) {
      try {
        processedTags = JSON.parse(tags);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de tags invalide'
        });
      }
    }

    // Calculer le stock total
    const totalStock = processedVariants.reduce((total, variant) => total + (variant.stock || 0), 0);

    // Créer le produit
    const featuredFlag = (isFeatured === 'true') || (isFeatured === undefined);
    const product = new Product({
      name,
      description,
      shortDescription,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      discount: discount ? parseFloat(discount) : 0,
      images,
      category,
      subCategory,
      brand,
      sku,
      variants: processedVariants,
      colors: processedColors,
      sizes: processedSizes,
      totalStock,
      isFeatured: featuredFlag,
      isNewProduct: isNew === 'true',
      isOnSale: isOnSale === 'true',
      tags: processedTags,
      weight: weight ? parseFloat(weight) : undefined,
      dimensions: dimensions ? JSON.parse(dimensions) : undefined,
      shipping: {
        freeShipping: freeShipping === 'true'
      },
      metaTitle,
      metaDescription
    });

    await product.save();

    // Populate pour la réponse
    await product.populate('category', 'name slug');

    res.status(201).json({
      message: 'Produit créé avec succès',
      product: {
        ...product.toObject(),
        images: product.images.map(image => getImageUrl(image))
      }
    });

  } catch (error) {
    console.error('=== ERREUR CRÉATION PRODUIT ===');
    console.error('Stack trace:', error.stack);

    // Erreur de duplication (ex: slug déjà existant)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'champ';
      return res.status(400).json({
        message: `Un produit avec ce ${field === 'slug' ? 'nom' : field} existe déjà`,
        error: error.message
      });
    }

    // Erreur de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Erreur de validation des données',
        errors: messages
      });
    }

    res.status(500).json({
      message: 'Erreur lors de la création du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Validation pour la mise à jour de produit (plus souple)
const productUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('ID de catégorie invalide')
];

// @route   PUT /api/products/:id
// @desc    Mettre à jour un produit
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireAdmin, uploadProductImages, uploadBuffersToCloudinary, handleUploadError, productUpdateValidation, async (req, res) => {
  try {
    console.log('=== DÉBUT MISE À JOUR PRODUIT ===');
    console.log('ID du produit:', req.params.id);
    console.log('Body reçu:', Object.keys(req.body));
    console.log('Files reçus:', req.files ? req.files.length : 0);
    console.log('uploadedImages:', req.uploadedImages ? req.uploadedImages.length : 0);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    console.log('Recherche du produit...');
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log('Produit non trouvé avec ID:', req.params.id);
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }
    console.log('Produit trouvé:', product.name);

    const {
      name,
      description,
      shortDescription,
      price,
      originalPrice,
      discount,
      category,
      subCategory,
      brand,
      sku,
      variants,
      colors,
      sizes,
      isFeatured,
      isNew,
      isOnSale,
      isActive,
      tags,
      weight,
      dimensions,
      freeShipping,
      metaTitle,
      metaDescription
    } = req.body;

    // Vérifier que la catégorie existe
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          message: 'Catégorie non trouvée'
        });
      }
    }

    // Gestion des images existantes et nouvelles
    console.log('=== GESTION DES IMAGES ===');
    let finalImages = [];

    // Récupérer les images existantes à conserver
    if (req.body.existingImages) {
      try {
        const existingImages = JSON.parse(req.body.existingImages);
        console.log('Images existantes à conserver:', existingImages);
        finalImages = [...existingImages];
      } catch (error) {
        console.error('Erreur lors du parsing des images existantes:', error);
      }
    }

    // Supprimer les images marquées pour suppression
    if (req.body.imagesToDelete) {
      try {
        const imagesToDelete = JSON.parse(req.body.imagesToDelete);
        // Supprimer physiquement les fichiers
        await Promise.all(imagesToDelete.map((img) => deleteFile(img)));
        // Retirer des images finales
        finalImages = finalImages.filter(img => !imagesToDelete.includes(img));
      } catch (error) {
        console.error('Erreur lors de la suppression des images:', error);
      }
    }

    // Ajouter les nouvelles images
    if ((req.files && req.files.length > 0) || (req.uploadedImages && req.uploadedImages.length > 0)) {
      const newImages = req.uploadedImages
        ? req.uploadedImages.map(u => u.url)
        : (req.files ? req.files.map(file => file.filename) : []);
      finalImages = [...finalImages, ...newImages];
    }

    // Mettre à jour les images du produit
    if (finalImages.length > 0) {
      product.images = finalImages;
    } else if (req.body.existingImages || req.body.imagesToDelete || req.files || req.uploadedImages) {
      // Si des modifications d'images ont été tentées mais qu'il ne reste aucune image
      return res.status(400).json({
        message: 'Au moins une image est requise pour le produit'
      });
    }

    // Mettre à jour les champs
    if (name) product.name = name;
    if (description) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (price) product.price = parseFloat(price);
    if (originalPrice !== undefined) product.originalPrice = parseFloat(originalPrice);
    if (discount !== undefined) product.discount = parseFloat(discount);
    if (category) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (brand !== undefined) product.brand = brand;
    if (sku !== undefined) product.sku = sku;
    if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true';
    if (isNew !== undefined) product.isNewProduct = isNew === 'true';
    if (isOnSale !== undefined) product.isOnSale = isOnSale === 'true';
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
    if (weight !== undefined) product.weight = parseFloat(weight);
    if (metaTitle !== undefined) product.metaTitle = metaTitle;
    if (metaDescription !== undefined) product.metaDescription = metaDescription;

    // Traiter les variantes
    if (variants) {
      try {
        product.variants = JSON.parse(variants);
        product.totalStock = product.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de variantes invalide'
        });
      }
    }

    // Traiter les couleurs
    if (colors) {
      try {
        product.colors = JSON.parse(colors);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de couleurs invalide'
        });
      }
    }

    // Traiter les tailles
    if (sizes) {
      try {
        product.sizes = JSON.parse(sizes);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de tailles invalide'
        });
      }
    }

    // Traiter les tags
    if (tags) {
      try {
        product.tags = JSON.parse(tags);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de tags invalide'
        });
      }
    }

    // Traiter les dimensions
    if (dimensions) {
      try {
        product.dimensions = JSON.parse(dimensions);
      } catch (error) {
        return res.status(400).json({
          message: 'Format de dimensions invalide'
        });
      }
    }

    // Traiter le shipping
    if (freeShipping !== undefined) {
      product.shipping.freeShipping = freeShipping === 'true';
    }

    console.log('Sauvegarde du produit...');
    await product.save();
    console.log('Produit sauvegardé avec succès');

    console.log('Population de la catégorie...');
    await product.populate('category', 'name slug');
    console.log('Catégorie populée');

    console.log('=== SUCCÈS MISE À JOUR ===');
    res.json({
      message: 'Produit mis à jour avec succès',
      product: {
        ...product.toObject(),
        images: product.images.map(image => getImageUrl(image))
      }
    });

  } catch (error) {
    console.error('=== ERREUR MISE À JOUR ===');
    console.error('Stack trace:', error.stack);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'champ';
      return res.status(400).json({
        message: `Un produit avec ce ${field === 'slug' ? 'nom' : field} existe déjà`,
        error: error.message
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Erreur de validation des données',
        errors: messages
      });
    }

    res.status(500).json({
      message: 'Erreur lors de la mise à jour du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Supprimer un produit
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    // Supprimer les images (Cloudinary ou local)
    await Promise.all((product.images || []).map((img) => deleteFile(img)));

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du produit'
    });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Ajouter une review à un produit
// @access  Private
router.post('/:id/reviews', authenticateToken, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Le commentaire ne peut pas dépasser 500 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà laissé une review
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        message: 'Vous avez déjà laissé une review pour ce produit'
      });
    }

    // Ajouter la review
    product.addReview(req.user._id, rating, comment);
    await product.save();

    res.json({
      message: 'Review ajoutée avec succès',
      review: {
        user: {
          id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        rating,
        comment,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la review:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout de la review'
    });
  }
});

module.exports = router;
