import { fetchFeaturedProducts, fetchNewProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { store } from '../store/store';
import api from '../services/api';
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

function collectCriticalImages(featuredProducts = [], bannerImage) {
  const urls = new Set();

  if (bannerImage) urls.add(bannerImage);

  featuredProducts.slice(0, 4).forEach((product) => {
    const image = product?.images?.[0];
    if (image) urls.add(resolveImageUrl(image, 480));
  });

  return [...urls];
}

export async function bootstrapApp(dispatch) {
  const minSplashMs = 1400;
  const maxWaitMs = 6000;

  const minDelay = new Promise((resolve) => {
    setTimeout(resolve, minSplashMs);
  });

  const dataPromise = (async () => {
    const [, , bannersResult] = await Promise.allSettled([
      dispatch(fetchFeaturedProducts()),
      dispatch(fetchCategories()),
      api.get('/banners'),
    ]);

    let bannerImage = DEFAULT_BANNER_IMAGE;
    if (bannersResult.status === 'fulfilled') {
      const banners = bannersResult.value?.data?.banners || [];
      if (banners[0]?.image) {
        bannerImage = resolveImageUrl(banners[0].image, 1200);
      }
    }

    let products = store.getState().products?.featuredProducts || [];

    if (products.length === 0) {
      await dispatch(fetchNewProducts());
      products = store.getState().products?.newProducts || [];
    }

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
