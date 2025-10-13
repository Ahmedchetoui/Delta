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

// Générer un numéro de commande unique avant de sauvegarder
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Génère un numéro basé sur la date et un nombre aléatoire
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    let isUnique = false;
    let randomPart;
    let newOrderNumber;

    while (!isUnique) {
      randomPart = Math.floor(1000 + Math.random() * 9000).toString();
      newOrderNumber = `CMD-${year}${month}${day}-${randomPart}`;
      
      const existingOrder = await this.constructor.findOne({ orderNumber: newOrderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
    }
    
    this.orderNumber = newOrderNumber;
  }
  next();
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

// Validation personnalisée : soit un utilisateur connecté, soit un email invité
orderSchema.pre('validate', function(next) {
  if (!this.user && !this.guestEmail) {
    next(new Error('Une commande doit avoir soit un utilisateur connecté, soit un email invité'));
  } else {
    next();
  }
});

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
