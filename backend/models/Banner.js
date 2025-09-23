const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'Voir les offres'
  },
  buttonLink: {
    type: String,
    trim: true,
    default: '/boutique'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  backgroundColor: {
    type: String,
    default: '#f8f9fa'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  position: {
    type: String,
    enum: ['center', 'left', 'right'],
    default: 'center'
  }
}, {
  timestamps: true
});

// Index pour l'ordre et le statut actif
bannerSchema.index({ order: 1, isActive: 1 });

// Méthode statique pour obtenir les bannières actives
bannerSchema.statics.getActiveBanners = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  }).sort({ order: 1 });
};

module.exports = mongoose.model('Banner', bannerSchema);
