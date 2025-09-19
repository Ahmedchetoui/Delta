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
  'https://delta-e79s.vercel.app'
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, serveurs) ou si l'origin est dans la liste blanche
    if (!origin) return callback(null, true);

    // Normaliser en supprimant un éventuel trailing slash
    const normalized = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(o => normalized === o.replace(/\/$/, ''));

    if (isAllowed) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`CORS: origin rejeté: ${origin}. Autorisés: ${allowedOrigins.join(', ')}`);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
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

// Route temporaire pour peupler la base de données (À SUPPRIMER EN PRODUCTION)
app.get('/api/seed-database', async (req, res) => {
  try {
    // Importer et exécuter le script de peuplement
    const seedFunction = require('./scripts/seedData');
    await seedFunction();
    res.json({ 
      message: 'Base de données peuplée avec succès !',
      timestamp: new Date().toISOString()
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
});
