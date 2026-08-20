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

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    // En production, les requêtes passent par le proxy Vercel (/api). Ainsi
    // le navigateur ne doit jamais contacter Render directement : cela évite
    // les échecs CORS qui ne touchaient que certains appareils/réseaux.
    if (hostname.endsWith('.vercel.app') || hostname === 'delta-fashion.vercel.app') {
      return '/api';
    }

    if (process.env.REACT_APP_API_URL) {
      return normalizeApiBaseUrl(process.env.REACT_APP_API_URL);
    }

    return `${protocol}//${hostname}:5000/api`;
  }

  if (process.env.REACT_APP_API_URL) {
    return normalizeApiBaseUrl(process.env.REACT_APP_API_URL);
  }

  return 'http://localhost:5000/api';
}

export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}
