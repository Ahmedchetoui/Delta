import { fetchHomeData } from '../store/slices/homeSlice';
import { store } from '../store/store';
import { getFirstProductImageUrl } from './productImages';
import { resolveImageUrl } from './imageUtils';
import { prefetchShopProducts } from './prefetch';

const DEFAULT_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=75';

const IMAGE_PRELOAD_BUDGET_MS = 1500;
const BOOTSTRAP_MAX_WAIT_MS = 6000;

export function preloadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve();
      return;
    }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function collectCriticalImages(products = [], bannerImage) {
  const urls = new Set();

  if (bannerImage) urls.add(bannerImage);

  products.slice(0, 4).forEach((product) => {
    const image = getFirstProductImageUrl(product?.images, 480);
    if (image) urls.add(image);
  });

  return [...urls];
}

export async function bootstrapApp(dispatch) {
  // Ne pas bloquer la landing plus de 6s (cold start Render peut prendre 30s+)
  const result = await Promise.race([
    dispatch(fetchHomeData()),
    new Promise((resolve) => {
      setTimeout(() => resolve(null), BOOTSTRAP_MAX_WAIT_MS);
    }),
  ]);

  if (result && fetchHomeData.fulfilled.match(result)) {
    prefetchShopProducts(dispatch);
  }

  const state = store.getState();
  const products = state.products.featuredProducts.length > 0
    ? state.products.featuredProducts
    : state.products.newProducts;

  const bannerFromApi = state.home.banners[0]?.image;
  const bannerImage = bannerFromApi
    ? resolveImageUrl(bannerFromApi, 1200)
    : DEFAULT_BANNER_IMAGE;

  const images = collectCriticalImages(products, bannerImage);

  // Préchargement images limité — ne bloque pas l'affichage des données
  await Promise.race([
    Promise.all(images.map((url) => preloadImage(url))),
    new Promise((resolve) => {
      setTimeout(resolve, IMAGE_PRELOAD_BUDGET_MS);
    }),
  ]);
}
