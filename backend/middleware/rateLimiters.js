const rateLimit = require('express-rate-limit');
const User = require('../models/User');

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

const orderEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 50,
  keyGenerator: (req) => {
    const email = req.body?.shippingAddress?.email;
    if (typeof email === 'string' && email.trim()) {
      return `order-email:${email.trim().toLowerCase()}`;
    }
    return req.ip;
  },
  message: { message: 'Trop de commandes pour cette adresse email. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 100,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 100,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Connexion admin : 3 tentatives / 15 min (email admin + IP). */
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 3 : 20,
  message: {
    message: 'Trop de tentatives de connexion admin. Réessayez dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `admin-login:${email}:${req.ip}`;
  },
  skip: async (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return true;
    const admin = await User.findOne({ email, role: 'admin' }).select('_id').lean();
    return !admin;
  },
});

module.exports = {
  guestOrderLimiter,
  orderCreateLimiter,
  orderEmailLimiter,
  loginLimiter,
  registerLimiter,
  adminLoginLimiter,
};
