const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Token d\'accès requis' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Compte désactivé' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré' 
      });
    }
    return res.status(500).json({ 
      message: 'Erreur d\'authentification' 
    });
  }
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentification requise' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Accès refusé. Droits administrateur requis.' 
    });
  }

  next();
};

// Middleware pour vérifier si l'utilisateur est propriétaire ou admin
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentification requise' 
    });
  }

  // Admin peut accéder à tout
  if (req.user.role === 'admin') {
    return next();
  }

  // Vérifier si l'utilisateur est propriétaire de la ressource
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (req.user._id.toString() !== resourceUserId) {
    return res.status(403).json({ 
      message: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres ressources.' 
    });
  }

  next();
};

// Middleware optionnel pour récupérer l'utilisateur si connecté
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnerOrAdmin,
  optionalAuth,
  generateToken
};
