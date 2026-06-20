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

/** Données modifiables en admin : le navigateur revalide à chaque visite. */
function publicCacheRevalidate(sMaxAge = 60) {
  return (_req, res, next) => {
    res.set(
      'Cache-Control',
      `public, max-age=0, must-revalidate, s-maxage=${sMaxAge}`
    );
    next();
  };
}

module.exports = publicCache;
module.exports.publicCacheRevalidate = publicCacheRevalidate;
