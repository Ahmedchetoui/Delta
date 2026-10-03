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

    // Ne pas initier SSE pendant l'analyse Lighthouse ou bots pour éviter timeout proxy
    const isBot = /Lighthouse|Google-InspectionTool|Chrome-Lighthouse|PageSpeed/i.test(navigator.userAgent || '');
    if (isBot) return undefined;

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

    let eventSource = null;
    let connectTimeout = null;

    // Retarder la connexion SSE pour laisser le chargement initial de la page 100% propre et fluide
    connectTimeout = setTimeout(() => {
      try {
        if (typeof EventSource !== 'undefined') {
          eventSource = new EventSource(`${getApiBaseUrl()}/catalog/events`);
          eventSource.addEventListener('catalog-update', queueRefresh);
          eventSource.onerror = () => {
            // Fermer silencieusement pour éviter d'inonder la console avec net::ERR_TIMED_OUT
            try { eventSource?.close(); } catch (_) {}
          };
        }
      } catch (_) {}
    }, 4000);

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshCatalog();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);

    const fallbackTimer = window.setInterval(refreshCatalog, FALLBACK_REFRESH_MS);

    return () => {
      window.clearTimeout(debounceTimer.current);
      window.clearTimeout(connectTimeout);
      window.clearInterval(fallbackTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      try { eventSource?.close(); } catch (_) {}
    };
  }, [dispatch, enabled]);
}
