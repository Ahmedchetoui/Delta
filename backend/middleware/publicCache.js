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

/**
 * Données modifiables en admin : cache court au CDN avec réponse périmée
 * servie pendant la revalidation. Cela évite que des dizaines de visiteurs
 * déclenchent simultanément les mêmes requêtes MongoDB.
 */
function publicCacheRevalidate(sMaxAge = 60, staleWhileRevalidate = 60) {
  return (_req, res, next) => {
    res.set(
      'Cache-Control',
      `public, max-age=0, must-revalidate, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );
    next();
  };
}

module.exports = publicCache;
module.exports.publicCacheRevalidate = publicCacheRevalidate;
