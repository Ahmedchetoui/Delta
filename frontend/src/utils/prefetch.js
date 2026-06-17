import { fetchProducts, fetchProduct } from '../store/slices/productSlice';

const prefetchedKeys = new Set();

function markPrefetched(key) {
  if (prefetchedKeys.has(key)) return false;
  prefetchedKeys.add(key);
  return true;
}

export function prefetchShopProducts(dispatch, params = { page: 1, limit: 12, sort: 'newest' }) {
  const key = `shop:${JSON.stringify(params)}`;
  if (!markPrefetched(key)) return;
  dispatch(fetchProducts(params));
}

export function prefetchProduct(dispatch, productId) {
  if (!productId) return;
  const key = `product:${productId}`;
  if (!markPrefetched(key)) return;
  dispatch(fetchProduct(productId));
}
