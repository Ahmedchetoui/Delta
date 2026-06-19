const { getImageUrl } = require('../middleware/upload');
const { normalizeProductImages } = require('./productImages');

function sanitizeProductForClient(product) {
  const variantStockTotal = (product.variants || []).reduce(
    (sum, v) => sum + (v.stock || 0),
    0
  );
  const hasVariantStock = (product.variants || []).some((v) => (v.stock || 0) > 0);
  const inStock =
    (product.totalStock || 0) > 0 || variantStockTotal > 0 || hasVariantStock;

  const sanitized = { ...product, inStock };
  delete sanitized.totalStock;

  if (sanitized.variants?.length) {
    sanitized.variants = sanitized.variants.map((v) => {
      const stock = v.stock || 0;
      const entry = {
        size: String(v.size ?? '').trim(),
        color: String(v.color ?? '').trim(),
        inStock: stock > 0,
      };
      if (v.price != null) entry.price = v.price;
      return entry;
    });
  }

  if (!sanitized.colors?.length && sanitized.variants?.length) {
    const names = [
      ...new Set(sanitized.variants.map((v) => v.color).filter(Boolean)),
    ];
    sanitized.colors = names.map((name) => ({ name, code: '' }));
  }

  return sanitized;
}

function enrichProduct(product) {
  const normalizedImages = normalizeProductImages(product.images).map((image) => ({
    url: getImageUrl(image.url),
    color: image.color || '',
  }));

  return {
    ...product,
    images: normalizedImages,
    finalPrice: product.discount > 0 && product.originalPrice
      ? product.originalPrice * (1 - product.discount / 100)
      : product.price,
  };
}

function mapProductsForClient(products) {
  return products.map((product) =>
    sanitizeProductForClient(enrichProduct(product))
  );
}

async function getProductCountsByCategory(Product, categoryIds) {
  if (!categoryIds.length) return {};

  const counts = await Product.aggregate([
    { $match: { category: { $in: categoryIds }, isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  return Object.fromEntries(counts.map(({ _id, count }) => [_id.toString(), count]));
}

function enrichCategoriesWithDetails(categories, countMap) {
  return categories.map((category) => ({
    ...category,
    image: category.image ? getImageUrl(category.image) : null,
    productCount: countMap[category._id.toString()] || 0,
  }));
}

module.exports = {
  sanitizeProductForClient,
  enrichProduct,
  mapProductsForClient,
  getProductCountsByCategory,
  enrichCategoriesWithDetails,
};
