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
  if (process.env.REACT_APP_API_URL) {
    return normalizeApiBaseUrl(process.env.REACT_APP_API_URL);
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
}

export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}
