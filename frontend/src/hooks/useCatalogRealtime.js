import { useEffect, useRef } from 'react';
import { fetchHomeData } from '../store/slices/homeSlice';
import { getApiBaseUrl } from '../config/apiConfig';

const FALLBACK_REFRESH_MS = 60000;
const EVENT_DEBOUNCE_MS = 250;

function notifyCatalogRefresh() {
  window.dispatchEvent(new CustomEvent('delta:catalog-updated'));
}

/**
 * Met à jour le catalogue ouvert dès qu'une modification est enregistrée par
 * l'admin (produit, stock, catégorie ou bannière). Le rafraîchissement toutes
 * les minutes garantit aussi la fraîcheur après une courte coupure réseau.
 */
export function useCatalogRealtime(dispatch, enabled = true) {
  const debounceTimer = useRef(null);
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const refreshCatalog = () => {
      const now = Date.now();
      if (now - lastRefreshAt.current < 750) return;
      lastRefreshAt.current = now;
      dispatch(fetchHomeData({ force: true }));
      notifyCatalogRefresh();
    };

    const queueRefresh = () => {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = window.setTimeout(refreshCatalog, EVENT_DEBOUNCE_MS);
    };

    const eventSource = typeof EventSource === 'undefined'
      ? null
      : new EventSource(`${getApiBaseUrl()}/catalog/events`);

    eventSource?.addEventListener('catalog-update', queueRefresh);

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshCatalog();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);

    const fallbackTimer = window.setInterval(refreshCatalog, FALLBACK_REFRESH_MS);

    return () => {
      window.clearTimeout(debounceTimer.current);
      window.clearInterval(fallbackTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      eventSource?.close();
    };
  }, [dispatch, enabled]);
}
