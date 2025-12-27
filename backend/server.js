const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuration CORS en premier
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:3000',
  'https://delta-fashion-e-commerce.vercel.app',
  'https://delta-12jv2d3wl-deltas-projects-ce7253f2.vercel.app',
  'https://delta-e79s.vercel.app',
  'https://delta-e79s-4lp8o17ah-deltas-projects-ce7253f2.vercel.app',
  'https://delta-e79s-7wjv9yhjg-deltas-projects-ce7253f2.vercel.app',
  'https://delta-e79s-d82s4f8jb-deltas-projects-ce7253f2.vercel.app',
  'https://delta-n5d8.onrender.com'
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, serveurs, mobile apps)
    if (!origin) return callback(null, true);

    // Normaliser en supprimant un éventuel trailing slash
    const normalized = origin.replace(/\/$/, '');

    // Vérifier si l'origin est dans la liste autorisée
    const isAllowed = allowedOrigins.some(o => normalized === o.replace(/\/$/, ''));

    // En développement, autoriser localhost avec n'importe quel port
    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(normalized);

    // Autoriser les domaines Vercel (pour les previews)
    const isVercel = /^https:\/\/.*\.vercel\.app$/.test(normalized);

    // Autoriser spécifiquement les domaines delta-e79s-* de votre projet
    const isDeltaVercel = /^https:\/\/delta-e79s-.*\.vercel\.app$/.test(normalized);

    if (isAllowed || isLocalhost || isVercel || isDeltaVercel) {
      console.log(`✅ CORS: origin autorisé: ${origin}`);
      return callback(null, true);
    }

    console.warn(`❌ CORS: origin rejeté: ${origin}`);
    console.warn(`📋 Origins autorisés: ${allowedOrigins.join(', ')}`);
    console.warn(`🔍 Vérifications: isAllowed=${isAllowed}, isLocalhost=${isLocalhost}, isVercel=${isVercel}`);
    return callback(null, false); // Ne pas lever d'erreur, juste refuser
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Cache preflight pendant 24h
};

app.use(cors(corsOptions));

// Gérer les requêtes preflight OPTIONS explicitement
app.options('*', cors(corsOptions));

// Middleware de sécurité
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images)
// Les fichiers sont enregistrés dans backend/uploads (voir middleware/upload.js)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache pour 1 jour
  immutable: true
}));

// Route pour servir manifest.json (si nécessaire depuis le backend)
app.get('/manifest.json', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    "short_name": "Delta Fashion",
    "name": "Delta Fashion - Votre style, notre passion",
    "icons": [
      {
        "src": `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/favicon.ico`,
        "sizes": "64x64 32x32 24x24 16x16",
        "type": "image/x-icon"
      },
      {
        "src": `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/logo192.png`,
        "type": "image/png",
        "sizes": "192x192"
      },
      {
        "src": `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/logo512.png`,
        "type": "image/png",
        "sizes": "512x512"
      }
    ],
    "start_url": ".",
    "display": "standalone",
    "theme_color": "#0ea5e9",
    "background_color": "#ffffff"
  });
});

// Routes pour servir les fichiers statiques du manifest
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, '../frontend/public/favicon.ico'));
});

app.get('/logo192.png', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, '../frontend/public/logo192.png'));
});

app.get('/logo512.png', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, '../frontend/public/logo512.png'));
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin-requests', require('./routes/adminRequests'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Delta Fashion API is running! 🛍️',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Vérification de la base de données
app.get('/api/db-health', async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 0:disconnected, 1:connected, 2:connecting, 3:disconnecting
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    let pingResult = null;
    if (state === 1 && mongoose.connection.db) {
      // Effectue un ping pour confirmer la réactivité de MongoDB
      const admin = mongoose.connection.db.admin();
      const ping = await admin.ping();
      pingResult = ping?.ok === 1 ? 'ok' : ping;
    }

    res.json({
      status: stateMap[state] || String(state),
      dbName: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
      ping: pingResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur /api/db-health:', error);
    res.status(500).json({ message: 'Erreur de vérification DB', error: error.message });
  }
});

// Route sécurisée pour peupler la base de données
app.get('/api/seed-database', async (req, res) => {
  try {
    // Sécurité : Vérifier le secret en production
    if (process.env.NODE_ENV === 'production') {
      const seedSecret = req.headers['x-seed-secret'];
      if (!seedSecret || seedSecret !== process.env.SEED_SECRET) {
        return res.status(403).json({
          message: 'Non autorisé. Secret requis en production.'
        });
      }
    }

    // Importer et exécuter le script de peuplement
    const seedFunction = require('./scripts/seedData');
    await seedFunction();
    res.json({
      message: 'Base de données peuplée avec succès !',
      timestamp: new Date().toISOString(),
      counts: {
        users: 2,
        categories: 8,
        products: 5
      }
    });
  } catch (error) {
    console.error('Erreur lors du peuplement:', error);
    res.status(500).json({
      message: 'Erreur lors du peuplement de la base de données',
      error: error.message
    });
  }
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion')
  .then(() => {
    console.log('✅ Connecté à MongoDB');
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB:', err);
  });

// Observabilité de la connexion MongoDB
mongoose.connection.on('connected', () => {
  console.log('🔌 Mongoose connecté');
});
mongoose.connection.on('error', (err) => {
  console.error('⚠️  Mongoose erreur de connexion:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('🔌 Mongoose déconnecté');
});
mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnecté');
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Delta Fashion démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`🛍️ Mode: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS configuré pour: ${allowedOrigins.join(', ')}`);
  console.log(`📋 Variables d'environnement chargées: ${Object.keys(process.env).filter(k => k.startsWith('CORS_') || k.startsWith('NODE_') || k.startsWith('MONGODB_')).join(', ')}`);
});
