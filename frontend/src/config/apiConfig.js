function normalizeApiBaseUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('/api')) {
      parsed.pathname = '/api' + (parsed.pathname === '/' ? '' : parsed.pathname);
    }
    return parsed.toString().replace(/\/$/, '');
  }
  return url;
}

const PRODUCTION_API_URL = 'https://delta-n5d8.onrender.com/api';

export function getApiBaseUrl() {
  if (process.env.REACT_APP_API_URL) {
    return normalizeApiBaseUrl(process.env.REACT_APP_API_URL);
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    // Déployé sur Vercel sans variable d'env → backend Render
    if (hostname.endsWith('.vercel.app') || hostname === 'delta-fashion.vercel.app') {
      return PRODUCTION_API_URL;
    }

    return `${protocol}//${hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
}

export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}
