export function normalizeSize(size) {
  return String(size ?? '').trim();
}

export function normalizeColorName(color) {
  return String(color ?? '').trim().toLowerCase();
}

export function sizesEqual(a, b) {
  return normalizeSize(a) === normalizeSize(b);
}

export function colorsEqual(a, b) {
  return normalizeColorName(a) === normalizeColorName(b);
}

export function variantHasStock(variant) {
  if (!variant) return false;
  if (typeof variant.inStock === 'boolean') return variant.inStock;
  return (variant.stock ?? 0) > 0;
}

export function productHasStock(product) {
  if (!product) return false;
  if (product.variants?.length) {
    if (product.variants.some(variantHasStock)) return true;
  }
  if (typeof product.inStock === 'boolean') return product.inStock;
  return (product.totalStock ?? 0) > 0;
}

export function getProductSizes(product) {
  if (!product) return [];

  const fromSizes = (product.sizes || []).map(normalizeSize).filter(Boolean);
  const fromVariants = (product.variants || []).map((v) => normalizeSize(v.size)).filter(Boolean);
  const unique = [...new Set([...fromSizes, ...fromVariants])];

  return unique.sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b, 'fr');
  });
}

export function sizeHasAvailableStock(product, size) {
  if (!product?.variants?.length) return productHasStock(product);
  return product.variants.some(
    (v) => sizesEqual(v.size, size) && variantHasStock(v)
  );
}

function sizeHasColorVariants(product, size) {
  return (product.variants || []).some(
    (v) => sizesEqual(v.size, size) && normalizeColorName(v.color)
  );
}

export function getVariantStock(product, size, colorName) {
  if (!product?.variants?.length || !size) return 0;

  if (colorName) {
    const exact = product.variants.find(
      (v) => sizesEqual(v.size, size) && colorsEqual(v.color, colorName)
    );
    if (exact) {
      return exact.stock ?? (exact.inStock ? 1 : 0);
    }
    if (sizeHasColorVariants(product, size)) return 0;
  }

  return product.variants
    .filter((v) => sizesEqual(v.size, size))
    .reduce((sum, v) => sum + (v.stock ?? (v.inStock ? 1 : 0)), 0);
}

export function isColorAvailableForSize(product, size, colorName) {
  if (!product?.variants?.length) return true;
  if (!size) return false;

  if (colorName && sizeHasColorVariants(product, size)) {
    return product.variants.some(
      (v) =>
        sizesEqual(v.size, size) &&
        colorsEqual(v.color, colorName) &&
        variantHasStock(v)
    );
  }

  if (colorName) {
    return product.variants.some(
      (v) =>
        sizesEqual(v.size, size) &&
        colorsEqual(v.color, colorName) &&
        variantHasStock(v)
    );
  }

  return sizeHasAvailableStock(product, size);
}

export function getAvailableColorsForSize(displayColors, product, size) {
  if (!size) return [];
  if (!product?.variants?.length) return displayColors;

  return displayColors.filter((color) =>
    isColorAvailableForSize(product, size, color.name)
  );
}
