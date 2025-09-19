const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
    unique: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'shirt' // icône par défaut
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  metaTitle: String,
  metaDescription: String
}, {
  timestamps: true
});

// Index pour améliorer les performances
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentCategory: 1 });

// Méthode pour générer le slug automatiquement avant validation
categorySchema.pre('validate', function(next) {
  if (!(this.isModified('name') || this.isNew)) return next();

  this.slug = (this.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  next();
});

// Méthode pour obtenir les sous-catégories
categorySchema.methods.getSubCategories = async function() {
  return await this.model('Category').find({ 
    parentCategory: this._id, 
    isActive: true 
  }).sort('order');
};

// Méthode pour obtenir le nombre de produits dans cette catégorie
categorySchema.methods.getProductCount = async function() {
  const Product = mongoose.model('Product');
  return await Product.countDocuments({ 
    category: this._id, 
    isActive: true 
  });
};

// Méthode statique pour obtenir toutes les catégories avec leurs sous-catégories
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ 
    isActive: true, 
    parentCategory: null 
  }).sort('order');
  
  const categoryTree = [];
  
  for (const category of categories) {
    const subCategories = await category.getSubCategories();
    categoryTree.push({
      ...category.toObject(),
      subCategories
    });
  }
  
  return categoryTree;
};

module.exports = mongoose.model('Category', categorySchema);
