// Configuration temporaire pour les tests
module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion',
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET doit être défini en production');
    }
    console.warn('⚠️  JWT_SECRET non défini — utilisez backend/.env en développement');
    return 'dev-only-insecure-secret';
  })(),
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
