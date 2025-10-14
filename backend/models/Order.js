const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optionnel pour les commandes invités
  },
  guestEmail: {
    type: String,
    required: false // Email pour les commandes invités
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: String,
    color: String,
    image: String,
    sku: String
  }],
  shippingAddress: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    postalCode: String,
    country: {
      type: String,
      default: 'Tunisie'
    },
    additionalInfo: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Tunisie'
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'bank_transfer', 'paypal', 'stripe'],
    default: 'cash_on_delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'TND'
  },
  notes: {
    customer: String,
    admin: String,
    internal: String
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: String
}, {
  timestamps: true
});

// Générer un numéro de commande unique avant la validation
orderSchema.pre('validate', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      // Génère un numéro sans vérification DB pour éviter les conditions de course
      // L'unicité sera garantie par l'index unique de MongoDB
      this.orderNumber = this.constructor.generateOrderNumber();
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Gestion des erreurs de duplication de numéro de commande
orderSchema.post('save', async function(error, doc, next) {
  if (error && error.code === 11000 && error.keyPattern && error.keyPattern.orderNumber) {
    // Erreur de duplication sur orderNumber, on régénère et on réessaie
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        doc.orderNumber = doc.constructor.generateOrderNumber();
        await doc.save();
        return next(); // Succès, on sort
      } catch (retryError) {
        if (retryError.code === 11000 && retryError.keyPattern && retryError.keyPattern.orderNumber) {
          attempts++;
          continue; // Nouvelle collision, on réessaie
        } else {
          return next(retryError); // Autre erreur, on la propage
        }
      }
    }

    // Si on arrive ici, on a échoué après plusieurs tentatives
    return next(new Error('Impossible de générer un numéro de commande unique après plusieurs tentatives'));
  }

  next(error); // Autre type d'erreur, on la propage
});

// Validation personnalisée : soit un utilisateur connecté, soit un email invité
orderSchema.pre('validate', function(next) {
  if (!this.user && !this.guestEmail) {
    next(new Error('Une commande doit avoir soit un utilisateur connecté, soit un email invité'));
  } else {
    next();
  }
});

// Méthode pour calculer le total
orderSchema.methods.calculateTotal = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + this.shippingCost + this.tax - this.discount;
  return this.total;
};

// Méthode pour obtenir le statut en français
orderSchema.methods.getStatusInFrench = function() {
  const statusMap = {
    'pending': 'En attente',
    'confirmed': 'Confirmée',
    'processing': 'En cours de traitement',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée',
    'refunded': 'Remboursée'
  };
  return statusMap[this.orderStatus] || this.orderStatus;
};

// Méthode pour obtenir le statut de paiement en français
orderSchema.methods.getPaymentStatusInFrench = function() {
  const statusMap = {
    'pending': 'En attente',
    'paid': 'Payé',
    'failed': 'Échoué',
    'refunded': 'Remboursé'
  };
  return statusMap[this.paymentStatus] || this.paymentStatus;
};

// Méthode pour obtenir la méthode de paiement en français
orderSchema.methods.getPaymentMethodInFrench = function() {
  const methodMap = {
    'cash_on_delivery': 'Paiement à la livraison',
    'bank_transfer': 'Virement bancaire',
    'paypal': 'PayPal',
    'stripe': 'Carte bancaire'
  };
  return methodMap[this.paymentMethod] || this.paymentMethod;
};

// Méthode pour annuler une commande
orderSchema.methods.cancelOrder = function(reason, cancelledBy) {
  this.orderStatus = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
};

// Méthode pour marquer comme livrée
orderSchema.methods.markAsDelivered = function() {
  this.orderStatus = 'delivered';
  this.deliveredAt = new Date();
};

// Méthode pour obtenir le nombre total d'articles
orderSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};



// Méthode statique pour générer un numéro de commande (sans vérification DB)
orderSchema.statics.generateOrderNumber = function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  let randomPart;
  // 5 chiffres = 90000 combinaisons possibles par jour (vs 9000 avec 4 chiffres)
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      randomPart = crypto.randomInt(10000, 100000).toString();
    } catch (e) {
      randomPart = Math.floor(10000 + Math.random() * 90000).toString();
    }
  } else {
    randomPart = Math.floor(10000 + Math.random() * 90000).toString();
  }

  return `CMD-${year}${month}${day}-${randomPart}`;
};

// Méthode statique pour générer un numéro de commande unique (avec vérification DB)
// Utilisée uniquement pour les tests ou cas spéciaux
orderSchema.statics.generateUniqueOrderNumber = async function() {
  let isUnique = false;
  let newOrderNumber;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    newOrderNumber = this.generateOrderNumber();

    const existingOrder = await this.findOne({ orderNumber: newOrderNumber });
    if (!existingOrder) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Impossible de générer un numéro de commande unique après plusieurs tentatives');
  }

  return newOrderNumber;
};

// Méthode statique pour obtenir les statistiques
orderSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);

  return stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 };
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
