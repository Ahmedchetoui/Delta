const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

const guestOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 100,
  message: { message: 'Trop de commandes créées. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  guestOrderLimiter,
  orderCreateLimiter,
};
