import { fetchHomeData } from '../store/slices/homeSlice';
import { prefetchShopProducts } from './prefetch';
import { readHomeCache } from './homeCache';

function scheduleShopPrefetch(dispatch) {
  const prefetch = () => prefetchShopProducts(dispatch);

  // Le catalogue complet ne doit pas concurrencer le hero et les images
  // visibles. On attend un moment où le navigateur est disponible.
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(prefetch, { timeout: 4000 });
    return;
  }

  setTimeout(prefetch, 2500);
}

export function bootstrapApp(dispatch) {
  const cachedHomeData = readHomeCache();
  const request = dispatch(fetchHomeData({ force: Boolean(cachedHomeData) }));

  request
    .unwrap()
    .then(() => scheduleShopPrefetch(dispatch))
    // L'écran d'accueil gère l'erreur et propose une relance. L'échec ne
    // doit pas produire une promesse non gérée ni bloquer l'interface.
    .catch(() => {});

  return request;
}
