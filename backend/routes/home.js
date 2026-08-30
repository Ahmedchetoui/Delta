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
const HOME_CACHE_TTL_MS = 60 * 1000;
let homeCache = null;
let homeCacheExpiresAt = 0;
let homeCacheRefresh = null;

async function loadHomeData() {
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

  const categoryIds = categories.map((category) => category._id);
  const countMap = await getProductCountsByCategory(Product, categoryIds);
  const featuredProducts = mapProductsForClient(featuredRaw);
  const newProducts = mapProductsForClient(newRaw);

  return {
    categories: enrichCategoriesWithDetails(categories, countMap),
    featuredProducts,
    newProducts,
    displayProducts: featuredProducts.length > 0 ? featuredProducts : newProducts,
    banners: banners.map((banner) => ({
      ...banner.toObject(),
      image: getImageUrl(banner.image),
    })),
  };
}

// @route   GET /api/home
// @desc    Données page d'accueil en un seul appel
// @access  Public
// Cache RAM et CDN courts pour éviter des requêtes MongoDB identiques lors
// des arrivées simultanées, sans retarder longtemps les changements d'admin.
router.get('/', publicCacheRevalidate(60, 300), async (req, res) => {
  if (homeCache && Date.now() < homeCacheExpiresAt) {
    res.set('X-Home-Cache', 'HIT');
    return res.json(homeCache);
  }

  try {
    if (!homeCacheRefresh) {
      homeCacheRefresh = loadHomeData()
        .then((data) => {
          homeCache = data;
          homeCacheExpiresAt = Date.now() + HOME_CACHE_TTL_MS;
          return data;
        })
        .finally(() => {
          homeCacheRefresh = null;
        });
    }

    if (homeCache) {
      homeCacheRefresh.catch((error) => {
        console.error('Erreur de rafraichissement du cache /api/home:', error);
      });
      res.set('X-Home-Cache', 'STALE');
      return res.json(homeCache);
    }

    const data = await homeCacheRefresh;
    res.set('X-Home-Cache', 'MISS');
    return res.json(data);
  } catch (error) {
    console.error('Erreur GET /api/home:', error);
    res.status(500).json({
      message: 'Erreur lors du chargement de la page d\'accueil',
    });
  }
});

module.exports = router;
