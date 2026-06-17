export function variantHasStock(variant) {
  if (!variant) return false;
  if (typeof variant.inStock === 'boolean') return variant.inStock;
  return (variant.stock ?? 0) > 0;
}

export function productHasStock(product) {
  if (!product) return false;
  if (typeof product.inStock === 'boolean') return product.inStock;
  return (product.totalStock ?? 0) > 0;
}
