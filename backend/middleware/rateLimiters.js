const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { createRateLimitStore } = require('./rateLimitStore');

const isProduction = process.env.NODE_ENV === 'production';

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

const guestOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('guest-order'),
});

// Plafond court : stoppe le spam immédiat (3 commandes / minute / IP)
const orderCreateBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 3 : 20,
  message: {
    message: 'Trop de commandes en peu de temps. Attendez une minute avant de réessayer.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('order-burst'),
});

const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 100,
  message: { message: 'Trop de commandes créées. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('order-create'),
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
  store: createRateLimitStore('order-email'),
});

const orderPhoneLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 50,
  keyGenerator: (req) => {
    const phone = normalizePhone(req.body?.shippingAddress?.phone);
    if (phone.length >= 8) {
      return `order-phone:${phone}`;
    }
    return req.ip;
  },
  message: {
    message: 'Trop de commandes pour ce numéro de téléphone. Réessayez plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('order-phone'),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 100,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('login'),
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 100,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('register'),
});

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
  store: createRateLimitStore('admin-login'),
});

const reviewCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  message: { message: 'Trop d\'avis envoyés. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('review-create'),
});

module.exports = {
  guestOrderLimiter,
  orderCreateBurstLimiter,
  orderCreateLimiter,
  orderEmailLimiter,
  orderPhoneLimiter,
  loginLimiter,
  registerLimiter,
  adminLoginLimiter,
  reviewCreateLimiter,
};
