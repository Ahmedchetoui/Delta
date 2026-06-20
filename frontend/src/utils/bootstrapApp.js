import { fetchHomeData } from '../store/slices/homeSlice';
import { store } from '../store/store';
import { getFirstProductImageUrl } from './productImages';
import { resolveImageUrl } from './imageUtils';
import { prefetchShopProducts } from './prefetch';

const IMAGE_PRELOAD_BUDGET_MS = 2000;
/** Attendre l'API au démarrage, sans bloquer indéfiniment (cold start Render) */
const BOOTSTRAP_MAX_WAIT_MS = 15000;

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
  const fetchPromise = dispatch(fetchHomeData());

  // Attendre la réponse API (ou échec), max 15s — évite d'ouvrir sans données
  await Promise.race([
    fetchPromise,
    new Promise((resolve) => {
      setTimeout(resolve, BOOTSTRAP_MAX_WAIT_MS);
    }),
  ]);

  const state = store.getState();

  if (state.home.loadedAt) {
    prefetchShopProducts(dispatch);

    const products = state.products.featuredProducts.length > 0
      ? state.products.featuredProducts
      : state.products.newProducts;

    const bannerFromApi = state.home.banners[0]?.image;
    const bannerImage = bannerFromApi
      ? resolveImageUrl(bannerFromApi, 1200)
      : null;

    const images = collectCriticalImages(products, bannerImage);

    if (images.length > 0) {
      await Promise.race([
        Promise.all(images.map((url) => preloadImage(url))),
        new Promise((resolve) => {
          setTimeout(resolve, IMAGE_PRELOAD_BUDGET_MS);
        }),
      ]);
    }
  }
}
