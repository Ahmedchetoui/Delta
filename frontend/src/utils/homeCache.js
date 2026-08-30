export const HOME_CACHE_KEY = 'delta-fashion:home:v1';
const HOME_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function hasHomeDataShape(data) {
  return data
    && Array.isArray(data.banners)
    && Array.isArray(data.categories)
    && Array.isArray(data.featuredProducts)
    && Array.isArray(data.newProducts);
}

export function readHomeCache() {
  if (typeof window === 'undefined') return null;

  try {
    const cached = JSON.parse(window.localStorage.getItem(HOME_CACHE_KEY));
    const isExpired = !cached?.savedAt || Date.now() - cached.savedAt > HOME_CACHE_MAX_AGE_MS;

    if (isExpired || !hasHomeDataShape(cached.data)) {
      window.localStorage.removeItem(HOME_CACHE_KEY);
      return null;
    }

    return cached.data;
  } catch (_error) {
    return null;
  }
}

export function writeHomeCache(data) {
  if (typeof window === 'undefined' || !hasHomeDataShape(data)) return;

  try {
    window.localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      data,
    }));
  } catch (_error) {
    // Local storage can be unavailable or full; the live response still works.
  }
}
