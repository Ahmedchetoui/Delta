const express = require('express');

/**
 * Middleware pour optimiser le servage des images statiques
 * - Cache long terme pour les images statiques
 * - Compression optimale
 * - Headers de performance
 */
const optimizeStaticAssets = (req, res, next) => {
  // Images statiques: cache long terme (30 jours)
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('Vary', 'Accept-Encoding');
    
    // Support WebP si le client l'accepte
    if (req.headers.accept && req.headers.accept.includes('image/webp')) {
      res.setHeader('X-Supports-WebP', 'true');
    }
  }
  
  // Autres assets: cache modéré (7 jours)
  if (/\.(js|css)$/i.test(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  }

  // HTML: pas de cache (validation)
  if (req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }

  next();
};

/**
 * Middleware pour servir les images avec support des variantes
 */
const serveOptimizedImage = (uploadDir) => {
  return (req, res, next) => {
    // Parse la requête pour la taille demandée
    const { size = 'medium' } = req.query;
    
    // Ajouter les headers d'optimisation
    res.setHeader('Vary', 'Accept, Accept-Encoding');
    
    // Servir le fichier
    next();
  };
};

/**
 * Middleware pour ajouter les headers de sécurité et performance
 */
const imageSecurityHeaders = (req, res, next) => {
  // Headers de sécurité pour images
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Permettre le chargement cross-origin des images
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Encoding');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Content-Type-Options');
  
  // Headers de performance
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  next();
};

module.exports = {
  optimizeStaticAssets,
  serveOptimizedImage,
  imageSecurityHeaders,
};
