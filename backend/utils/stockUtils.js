const mongoose = require('mongoose');
const Product = require('../models/Product');

function normalizeSize(size) {
  return String(size ?? '').trim();
}

function normalizeColor(color) {
  return String(color ?? '').trim().toLowerCase();
}

function sizesMatch(a, b) {
  return normalizeSize(a) === normalizeSize(b);
}

function colorsMatch(a, b) {
  return normalizeColor(a) === normalizeColor(b);
}

function variantInStock(variant) {
  return (variant?.stock ?? 0) > 0;
}

function getVariantsForSize(product, size, color) {
  if (!size || !product.variants?.length) return [];

  if (color) {
    const exact = product.variants.find(
      (v) => sizesMatch(v.size, size) && colorsMatch(v.color, color)
    );
    return exact ? [exact] : [];
  }

  return product.variants.filter((v) => sizesMatch(v.size, size));
}

function getAvailableStock(product, size, color) {
  const variants = getVariantsForSize(product, size, color);
  if (variants.length > 0) {
    return variants.reduce((sum, v) => sum + (variantInStock(v) ? (v.stock || 0) : 0), 0);
  }

  // Couleurs catalogue : stock par taille si pas de variante couleur exacte
  if (product.colors?.length > 0 && size && product.variants?.length) {
    const forSize = product.variants.filter((v) => sizesMatch(v.size, size));
    if (forSize.length > 0) {
      return forSize.reduce((sum, v) => sum + (variantInStock(v) ? (v.stock || 0) : 0), 0);
    }
  }

  return product.totalStock || 0;
}

function findVariant(product, size, color) {
  if (!size || !product.variants?.length) return null;

  if (color) {
    const exact = product.variants.find(
      (v) => sizesMatch(v.size, size) && colorsMatch(v.color, color)
    );
    if (exact) return exact;
  }

  const forSize = product.variants.filter((v) => sizesMatch(v.size, size));
  if (forSize.length === 0) return null;
  if (forSize.length === 1) return forSize[0];

  return forSize.find((v) => variantInStock(v)) || forSize[0];
}

function syncTotalStock(product) {
  if (product.variants?.length > 0) {
    product.totalStock = product.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
  }
}

function applyStockDeduction(product, item) {
  const variant = findVariant(product, item.size, item.color);
  if (variant) {
    const available = variant.stock || 0;
    if (available < item.quantity) {
      throw new Error(`Stock insuffisant pour ${product.name}`);
    }
    variant.stock = Math.max(0, available - item.quantity);
    product.markModified('variants');
    syncTotalStock(product);
    return;
  }

  if ((product.totalStock || 0) < item.quantity) {
    throw new Error(`Stock insuffisant pour ${product.name}`);
  }
  product.totalStock = Math.max(0, product.totalStock - item.quantity);
}

function applyStockRestore(product, item) {
  const variant = findVariant(product, item.size, item.color);
  if (variant) {
    variant.stock += item.quantity;
    product.markModified('variants');
    syncTotalStock(product);
    return;
  }
  product.totalStock += item.quantity;
}

async function deductOrderStock(order) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error('Produit introuvable lors de la déduction de stock');
      }

      const available = getAvailableStock(product, item.size, item.color);
      if (available < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      applyStockDeduction(product, item);
      await product.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function restoreOrderStock(order) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) continue;

      applyStockRestore(product, item);
      await product.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  normalizeSize,
  normalizeColor,
  sizesMatch,
  colorsMatch,
  getVariantsForSize,
  getAvailableStock,
  findVariant,
  syncTotalStock,
  applyStockDeduction,
  applyStockRestore,
  deductOrderStock,
  restoreOrderStock,
};
