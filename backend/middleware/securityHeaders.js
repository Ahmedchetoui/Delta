/**
 * Middleware pour configurer les en-têtes de sécurité globaux
 * et réduire les avertissements de suivi tiers
 */

const securityHeadersMiddleware = (req, res, next) => {
  // Headers CORS généraux
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Accept-Encoding, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range, Content-Length');
  
  // Headers pour le chargement cross-origin
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Referrer policy pour réduire les trackers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // X-Frame-Options pour sécurité
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Headers supplémentaires pour les Tracking Prevention
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  
  next();
};

module.exports = {
  securityHeadersMiddleware,
};
