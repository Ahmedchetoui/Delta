/**
 * Cache HTTP pour les réponses catalogue publiques (CDN / navigateur).
 * @param {number} maxAge - durée en secondes (défaut 5 min)
 */
function publicCache(maxAge = 300) {
  return (_req, res, next) => {
    res.set(
      'Cache-Control',
      `public, max-age=${maxAge}, stale-while-revalidate=60`
    );
    next();
  };
}

module.exports = publicCache;
