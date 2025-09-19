const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'La description courte ne peut pas dépasser 200 caractères']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Le prix original ne peut pas être négatif']
  },
  discount: {
    type: Number,
    min: [0, 'La remise ne peut pas être négative'],
    max: [100, 'La remise ne peut pas dépasser 100%'],
    default: 0
  },
  images: [{
    type: String,
    required: [true, 'Au moins une image est requise']
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La catégorie est requise']
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  variants: [{
    size: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
      required: true
    },
    color: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Le stock ne peut pas être négatif'],
      default: 0
    },
    price: {
      type: Number,
      min: [0, 'Le prix ne peut pas être négatif']
    }
  }],
  colors: [{
    name: String,
    code: String
  }],
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']
  }],
  totalStock: {
    type: Number,
    required: true,
    min: [0, 'Le stock total ne peut pas être négatif'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  shipping: {
    weight: Number,
    freeShipping: {
      type: Boolean,
      default: false
    }
  },
  metaTitle: String,
  metaDescription: String,
  viewCount: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isOnSale: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });

// Générer le slug et calculer des champs dérivés avant validation
productSchema.pre('validate', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = (this.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Calculer le prix avec remise
  if (this.originalPrice && this.discount > 0) {
    this.price = this.originalPrice * (1 - this.discount / 100);
  }

  // Calculer le stock total
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((total, variant) => total + variant.stock, 0);
  }

  next();
});

// Méthode pour calculer le prix final
productSchema.methods.getFinalPrice = function() {
  if (this.discount > 0) {
    return this.originalPrice * (1 - this.discount / 100);
  }
  return this.price;
};

// Méthode pour vérifier si le produit est en stock
productSchema.methods.isInStock = function() {
  return this.totalStock > 0;
};

// Méthode pour obtenir le stock d'une variante spécifique
productSchema.methods.getVariantStock = function(size, color) {
  const variant = this.variants.find(v => 
    v.size === size && v.color === color
  );
  return variant ? variant.stock : 0;
};

// Méthode pour mettre à jour le stock
productSchema.methods.updateStock = function(size, color, quantity) {
  const variant = this.variants.find(v => 
    v.size === size && v.color === color
  );
  
  if (variant) {
    variant.stock = Math.max(0, variant.stock - quantity);
    this.totalStock = this.variants.reduce((total, v) => total + v.stock, 0);
    return true;
  }
  return false;
};

// Méthode pour ajouter une review
productSchema.methods.addReview = function(userId, rating, comment) {
  this.reviews.push({ user: userId, rating, comment });
  
  // Recalculer la moyenne des notes
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
};

module.exports = mongoose.model('Product', productSchema);
