const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadSingleImage, uploadBuffersToCloudinary, handleUploadError, deleteFile, getImageUrl } = require('../middleware/upload');

const router = express.Router();

// Validation pour la création/mise à jour de catégorie
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('ID de catégorie parent invalide'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('L\'ordre doit être un nombre entier positif')
];

// @route   GET /api/categories
// @desc    Obtenir toutes les catégories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    
    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .sort({ order: 1, name: 1 })
      .lean();

    // Ajouter les URLs d'images et le nombre de produits
    const categoriesWithDetails = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category._id, 
          isActive: true 
        });
        
        return {
          ...category,
          image: category.image ? getImageUrl(category.image) : null,
          productCount
        };
      })
    );

    res.json({ categories: categoriesWithDetails });

  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

// @route   GET /api/categories/tree
// @desc    Obtenir l'arbre des catégories avec sous-catégories
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const categoryTree = await Category.getCategoryTree();

    // Ajouter les URLs d'images et le nombre de produits pour chaque catégorie
    const treeWithDetails = await Promise.all(
      categoryTree.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category._id, 
          isActive: true 
        });

        const subCategoriesWithDetails = await Promise.all(
          category.subCategories.map(async (subCategory) => {
            const subProductCount = await Product.countDocuments({ 
              category: subCategory._id, 
              isActive: true 
            });
            
            return {
              ...subCategory,
              image: subCategory.image ? getImageUrl(subCategory.image) : null,
              productCount: subProductCount
            };
          })
        );

        return {
          ...category,
          image: category.image ? getImageUrl(category.image) : null,
          productCount,
          subCategories: subCategoriesWithDetails
        };
      })
    );

    res.json({ categories: treeWithDetails });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'arbre des catégories:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'arbre des catégories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Obtenir une catégorie par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({
        message: 'Catégorie non trouvée'
      });
    }

    // Obtenir les sous-catégories
    const subCategories = await Category.find({ 
      parentCategory: category._id, 
      isActive: true 
    }).sort('order');

    // Obtenir le nombre de produits
    const productCount = await Product.countDocuments({ 
      category: category._id, 
      isActive: true 
    });

    res.json({
      category: {
        ...category,
        image: category.image ? getImageUrl(category.image) : null,
        productCount,
        subCategories: subCategories.map(sub => ({
          ...sub.toObject(),
          image: sub.image ? getImageUrl(sub.image) : null
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la catégorie'
    });
  }
});

// @route   GET /api/categories/slug/:slug
// @desc    Obtenir une catégorie par slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    })
      .populate('parentCategory', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({
        message: 'Catégorie non trouvée'
      });
    }

    // Obtenir les sous-catégories
    const subCategories = await Category.find({ 
      parentCategory: category._id, 
      isActive: true 
    }).sort('order');

    // Obtenir le nombre de produits
    const productCount = await Product.countDocuments({ 
      category: category._id, 
      isActive: true 
    });

    res.json({
      category: {
        ...category,
        image: category.image ? getImageUrl(category.image) : null,
        productCount,
        subCategories: subCategories.map(sub => ({
          ...sub.toObject(),
          image: sub.image ? getImageUrl(sub.image) : null
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la catégorie'
    });
  }
});

// @route   GET /api/categories/:id/products
// @desc    Obtenir les produits d'une catégorie
// @access  Public
router.get('/:id/products', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'newest' } = req.query;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Catégorie non trouvée'
      });
    }

    // Construire le filtre pour inclure les sous-catégories
    const subCategories = await Category.find({ 
      parentCategory: category._id, 
      isActive: true 
    });
    
    const categoryIds = [category._id, ...subCategories.map(sub => sub._id)];

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find({ 
        category: { $in: categoryIds }, 
        isActive: true 
      })
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments({ 
        category: { $in: categoryIds }, 
        isActive: true 
      })
    ]);

    // Ajouter les URLs d'images
    const productsWithUrls = products.map(product => ({
      ...product,
      images: product.images.map(image => getImageUrl(image))
    }));

    res.json({
      category: {
        ...category.toObject(),
        image: category.image ? getImageUrl(category.image) : null
      },
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
    console.error('Erreur lors de la récupération des produits de la catégorie:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits de la catégorie'
    });
  }
});

// @route   POST /api/categories
// @desc    Créer une nouvelle catégorie
// @access  Private (Admin)
router.post('/', authenticateToken, requireAdmin, uploadSingleImage, uploadBuffersToCloudinary, handleUploadError, categoryValidation, async (req, res) => {
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
      parentCategory,
      order,
      icon,
      metaTitle,
      metaDescription
    } = req.body;

    // Vérifier que la catégorie parent existe si fournie
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          message: 'Catégorie parent non trouvée'
        });
      }
    }

    // Traiter l'image uploadée (Cloudinary ou local)
    let image = '';
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      // Image uploadée sur Cloudinary
      image = req.uploadedImages[0].url;
    } else if (req.file) {
      // Image uploadée localement (fallback)
      image = req.file.filename;
    }

    const category = new Category({
      name,
      description,
      image,
      parentCategory,
      order: order ? parseInt(order) : 0,
      icon: icon || 'shirt',
      metaTitle,
      metaDescription
    });

    await category.save();
    await category.populate('parentCategory', 'name slug');

    res.status(201).json({
      message: 'Catégorie créée avec succès',
      category: {
        ...category.toObject(),
        image: category.image ? getImageUrl(category.image) : null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la catégorie'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Mettre à jour une catégorie
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireAdmin, uploadSingleImage, uploadBuffersToCloudinary, handleUploadError, categoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Catégorie non trouvée'
      });
    }

    const {
      name,
      description,
      parentCategory,
      order,
      icon,
      isActive,
      metaTitle,
      metaDescription
    } = req.body;

    // Vérifier que la catégorie parent existe si fournie
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          message: 'Catégorie parent non trouvée'
        });
      }

      // Vérifier qu'on ne crée pas une boucle (catégorie parent de sa propre catégorie parent)
      if (parentCategory === req.params.id) {
        return res.status(400).json({
          message: 'Une catégorie ne peut pas être parent d\'elle-même'
        });
      }
    }

    // Traiter la nouvelle image si fournie (Cloudinary ou local)
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      // Supprimer l'ancienne image
      if (category.image) {
        deleteFile(category.image);
      }
      // Image uploadée sur Cloudinary
      category.image = req.uploadedImages[0].url;
    } else if (req.file) {
      // Supprimer l'ancienne image
      if (category.image) {
        deleteFile(category.image);
      }
      // Image uploadée localement (fallback)
      category.image = req.file.filename;
    }

    // Mettre à jour les champs
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;
    if (order !== undefined) category.order = parseInt(order);
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive === 'true';
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined) category.metaDescription = metaDescription;

    await category.save();
    await category.populate('parentCategory', 'name slug');

    res.json({
      message: 'Catégorie mise à jour avec succès',
      category: {
        ...category.toObject(),
        image: category.image ? getImageUrl(category.image) : null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la catégorie'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Supprimer une catégorie
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier s'il y a des sous-catégories
    const subCategories = await Category.find({ parentCategory: category._id });
    if (subCategories.length > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer une catégorie qui a des sous-catégories'
      });
    }

    // Vérifier s'il y a des produits dans cette catégorie
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer une catégorie qui contient des produits'
      });
    }

    // Supprimer l'image
    if (category.image) {
      deleteFile(category.image);
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Catégorie supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la catégorie'
    });
  }
});

// @route   PUT /api/categories/:id/order
// @desc    Mettre à jour l'ordre d'une catégorie
// @access  Private (Admin)
router.put('/:id/order', authenticateToken, requireAdmin, [
  body('order')
    .isInt({ min: 0 })
    .withMessage('L\'ordre doit être un nombre entier positif')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { order } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: 'Catégorie non trouvée'
      });
    }

    category.order = parseInt(order);
    await category.save();

    res.json({
      message: 'Ordre de la catégorie mis à jour avec succès',
      category: {
        ...category.toObject(),
        image: category.image ? getImageUrl(category.image) : null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'ordre:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'ordre'
    });
  }
});

module.exports = router;
