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

export function isColorAvailableForSize(product, size, colorName) {
  if (!product?.variants?.length) return true;
  if (!size) return false;

  return product.variants.some(
    (v) =>
      sizesEqual(v.size, size) &&
      colorsEqual(v.color, colorName) &&
      variantHasStock(v)
  );
}

export function getAvailableColorsForSize(displayColors, product, size) {
  if (!size) return [];
  if (!product?.variants?.length) return displayColors;

  return displayColors.filter((color) =>
    isColorAvailableForSize(product, size, color.name)
  );
}
