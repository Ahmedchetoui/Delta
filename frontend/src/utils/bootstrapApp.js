import { fetchHomeData } from '../store/slices/homeSlice';
import { store } from '../store/store';
import { resolveImageUrl } from './imageUtils';

const DEFAULT_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=75';

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
    const image = product?.images?.[0];
    if (image) urls.add(resolveImageUrl(image, 480));
  });

  return [...urls];
}

export async function bootstrapApp(dispatch) {
  const minSplashMs = 1000;
  const maxWaitMs = 6000;

  const minDelay = new Promise((resolve) => {
    setTimeout(resolve, minSplashMs);
  });

  const dataPromise = (async () => {
    await dispatch(fetchHomeData());

    const state = store.getState();
    const products = state.products.featuredProducts.length > 0
      ? state.products.featuredProducts
      : state.products.newProducts;

    const bannerFromApi = state.home.banners[0]?.image;
    const bannerImage = bannerFromApi
      ? resolveImageUrl(bannerFromApi, 1200)
      : DEFAULT_BANNER_IMAGE;

    const images = collectCriticalImages(products, bannerImage);
    await Promise.all(images.map((url) => preloadImage(url)));
  })();

  const timeout = new Promise((resolve) => {
    setTimeout(resolve, maxWaitMs);
  });

  await Promise.race([
    Promise.all([minDelay, dataPromise]),
    timeout,
  ]);
}
