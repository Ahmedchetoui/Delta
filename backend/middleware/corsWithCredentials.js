/**
 * Middleware pour gérer les CORS avec credentials de manière sécurisée
 * Problème: Quand credentials: true, on ne peut pas utiliser wildcard '*'
 * Solution: Retourner l'origin spécifique dans Access-Control-Allow-Origin
 */

const corsWithCredentials = (allowedOrigins) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    // Si pas d'origin (requête non-CORS), continuer
    if (!origin) {
      return next();
    }

    const normalized = origin.replace(/\/$/, '');

    // Vérifier si l'origin est autorisé
    const isAllowed = allowedOrigins.some(o => normalized === o.replace(/\/$/, ''));
    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(normalized);
    const isVercel = /^https:\/\/.*\.vercel\.app$/.test(normalized);
    const isDeltaVercel = /^https:\/\/delta.*\.vercel\.app$/.test(normalized);
    const isDeltaFashion = normalized === 'https://delta-fashion.vercel.app';

    if (isAllowed || isLocalhost || isVercel || isDeltaVercel || isDeltaFashion) {
      // ✅ Retourner l'origin SPÉCIFIQUE (pas de wildcard avec credentials)
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Accept-Encoding, X-CSRF-Token');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range, Content-Length, X-Total-Count');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 heures
      
      console.log(`✅ CORS (credentials): origin autorisé: ${origin}`);
    } else {
      console.warn(`❌ CORS: origin rejeté: ${origin}`);
      console.warn(`📋 Origins autorisés: ${allowedOrigins.join(', ')}`);
    }

    // Pour les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };
};

module.exports = {
  corsWithCredentials,
};
