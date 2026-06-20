const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const { publicCacheRevalidate } = require('../middleware/publicCache');
const { getImageUrl } = require('../middleware/upload');
const {
  mapProductsForClient,
  getProductCountsByCategory,
  enrichCategoriesWithDetails,
} = require('../utils/catalogHelpers');

const router = express.Router();

// @route   GET /api/home
// @desc    Données page d'accueil en un seul appel
// @access  Public
router.get('/', publicCacheRevalidate(60), async (req, res) => {
  try {
    const [categories, featuredRaw, newRaw, banners] = await Promise.all([
      Category.find({ isActive: true })
        .populate('parentCategory', 'name slug')
        .sort({ order: 1, name: 1 })
        .lean(),
      Product.find({ isActive: true, isFeatured: true })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ isActive: true, isNewProduct: true })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Banner.getActiveBanners(),
    ]);

    const categoryIds = categories.map((c) => c._id);
    const countMap = await getProductCountsByCategory(Product, categoryIds);

    const featuredProducts = mapProductsForClient(featuredRaw);
    const newProducts = mapProductsForClient(newRaw);
    const displayProducts = featuredProducts.length > 0 ? featuredProducts : newProducts;

    const bannersWithUrls = banners.map((banner) => ({
      ...banner.toObject(),
      image: getImageUrl(banner.image),
    }));

    res.json({
      categories: enrichCategoriesWithDetails(categories, countMap),
      featuredProducts,
      newProducts,
      displayProducts,
      banners: bannersWithUrls,
    });
  } catch (error) {
    console.error('Erreur GET /api/home:', error);
    res.status(500).json({
      message: 'Erreur lors du chargement de la page d\'accueil',
    });
  }
});

module.exports = router;
