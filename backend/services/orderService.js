const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { createFiabiloShipment } = require('./fiabiloService');
const {
  getAvailableStock,
  applyStockDeduction,
  syncTotalStock,
} = require('../utils/stockUtils');
const { calculateShippingCost, PAYMENT_METHOD_COD } = require('../utils/orderConstants');
const { normalizeGuestPhone } = require('../utils/phoneUtils');
const { getOrderItemImage } = require('../utils/productImages');
const { getImageUrl } = require('../middleware/upload');

class OrderServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'OrderServiceError';
    this.statusCode = statusCode;
  }
}

function productRequiresColor(product) {
  if (product.colors?.length > 0) return true;
  return product.variants?.some((v) => v.color && String(v.color).trim()) ?? false;
}

function mapOrderResponse(order) {
  return {
    ...order.toObject(),
    items: order.items.map((item) => ({
      ...item,
      image: getImageUrl(item.image),
    })),
  };
}

async function buildOrderItems(items, products) {
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.product);

    if (!product) {
      throw new OrderServiceError(`Produit ${item.product} non trouvé`, 400);
    }

    if (productRequiresColor(product) && !item.color) {
      throw new OrderServiceError(
        `Veuillez sélectionner une couleur pour ${product.name}`,
        400
      );
    }

    if (item.size && product.variants?.length) {
      const available = item.color
        ? getAvailableStock(product, item.size, item.color)
        : getAvailableStock(product, item.size, null);
      if (available < item.quantity) {
        const label = item.color ? `${item.size}, ${item.color}` : item.size;
        throw new OrderServiceError(
          `Stock insuffisant pour ${product.name} (${label})`,
          400
        );
      }
    } else if (product.totalStock < item.quantity) {
      throw new OrderServiceError(
        `Stock insuffisant pour le produit ${product.name}`,
        400
      );
    }

    const finalPrice = product.getFinalPrice();
    subtotal += finalPrice * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: finalPrice,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
      image: getOrderItemImage(product.images, item.color),
      sku: product.sku || null,
    });
  }

  return { orderItems, subtotal };
}

async function syncOrderWithFiabilo(orderId, adminUserId = null) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    const result = await createFiabiloShipment(order);
    if (!result) return;

    order.fiabilo = {
      trackingCode: result.trackingCode,
      labelUrl: result.labelUrl,
      status: 'En attente',
      syncStatus: 'synced',
      error: null,
      syncedAt: new Date(),
      confirmedBy: adminUserId || order.fiabilo?.confirmedBy || null,
      confirmedAt: adminUserId ? new Date() : order.fiabilo?.confirmedAt || null,
    };
    if (order.orderStatus === 'pending') {
      order.orderStatus = 'confirmed';
    }
    await order.save();
  } catch (error) {
    console.error(`[Fiabilo] Échec sync commande ${orderId}:`, error.message);
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        'fiabilo.syncStatus': 'error',
        'fiabilo.error': error.message,
        'fiabilo.syncedAt': new Date(),
      },
    });
    throw error;
  }
}

async function finalizeOrder(order) {
  const updated = await Order.findById(order._id).populate([
    { path: 'user', select: 'firstName lastName email' },
    { path: 'items.product', select: 'name images slug' },
  ]);
  return mapOrderResponse(updated || order);
}

async function deductStockForItems(items, session) {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);
    if (!product) {
      throw new OrderServiceError('Produit introuvable lors de la réservation de stock', 400);
    }

    const available = getAvailableStock(product, item.size, item.color);
    if (available < item.quantity) {
      const label = item.color ? `${item.size}, ${item.color}` : item.size || 'stock global';
      throw new OrderServiceError(
        `Stock insuffisant pour ${product.name} (${label})`,
        400
      );
    }

    applyStockDeduction(product, item);
    await product.save({ session });
  }
}

function prepareShippingAddress(shippingAddress) {
  return {
    ...shippingAddress,
    email: String(shippingAddress?.email || '').trim(),
  };
}

function resolveGuestIdentifier(userId, shippingAddress) {
  if (userId) return null;
  return normalizeGuestPhone(shippingAddress.phone);
}

async function createOrderWithTransaction(orderData, userId, idempotencyKey = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      notes,
      isGift,
      giftMessage,
    } = orderData;

    const uniqueProductIds = Array.from(new Set(items.map((item) => String(item.product))));
    const products = await Product.find({
      _id: { $in: uniqueProductIds },
      isActive: true,
    }).session(session);

    if (products.length !== uniqueProductIds.length) {
      throw new OrderServiceError('Un ou plusieurs produits ne sont pas disponibles', 400);
    }

    const { orderItems, subtotal } = await buildOrderItems(items, products);
    const shippingCost = calculateShippingCost();
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    await deductStockForItems(orderItems, session);

    const normalizedShipping = prepareShippingAddress(shippingAddress);

    const orderDoc = {
      user: userId || null,
      items: orderItems,
      shippingAddress: normalizedShipping,
      billingAddress: billingAddress || normalizedShipping,
      paymentMethod: PAYMENT_METHOD_COD,
      subtotal,
      shippingCost,
      tax,
      total,
      notes,
      isGift: isGift === true,
      giftMessage,
      guestEmail: resolveGuestIdentifier(userId, normalizedShipping),
      stockDeducted: true,
      fiabilo: { syncStatus: 'pending' },
    };

    if (idempotencyKey && String(idempotencyKey).trim()) {
      orderDoc.idempotencyKey = String(idempotencyKey).trim();
    }

    const order = new Order(orderDoc);

    await order.save({ session });
    await session.commitTransaction();

    return finalizeOrder(order);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function createOrderWithSequentialUpdates(orderData, userId, idempotencyKey = null) {
  const {
    items,
    shippingAddress,
    billingAddress,
    notes,
    isGift,
    giftMessage,
  } = orderData;

  const uniqueProductIds = Array.from(new Set(items.map((item) => String(item.product))));
  const products = await Product.find({
    _id: { $in: uniqueProductIds },
    isActive: true,
  });

  if (products.length !== uniqueProductIds.length) {
    throw new OrderServiceError('Un ou plusieurs produits ne sont pas disponibles', 400);
  }

  const { orderItems, subtotal } = await buildOrderItems(items, products);
  const shippingCost = calculateShippingCost();
  const tax = 0;
  const total = subtotal + shippingCost + tax;

  const updatedProductIds = [];

  try {
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new OrderServiceError('Produit introuvable lors de la réservation de stock', 400);
      }

      const available = getAvailableStock(product, item.size, item.color);
      if (available < item.quantity) {
        throw new OrderServiceError(`Stock insuffisant pour ${product.name}`, 400);
      }

      applyStockDeduction(product, item);
      await product.save();
      updatedProductIds.push(product._id);
    }

    const normalizedShipping = prepareShippingAddress(shippingAddress);

    const orderDoc = {
      user: userId || null,
      items: orderItems,
      shippingAddress: normalizedShipping,
      billingAddress: billingAddress || normalizedShipping,
      paymentMethod: PAYMENT_METHOD_COD,
      subtotal,
      shippingCost,
      tax,
      total,
      notes,
      isGift: isGift === true,
      giftMessage,
      guestEmail: resolveGuestIdentifier(userId, normalizedShipping),
      stockDeducted: true,
      fiabilo: { syncStatus: 'pending' },
    };

    if (idempotencyKey && String(idempotencyKey).trim()) {
      orderDoc.idempotencyKey = String(idempotencyKey).trim();
    }

    const order = new Order(orderDoc);

    await order.save();

    return finalizeOrder(order);
  } catch (error) {
    for (const productId of updatedProductIds.reverse()) {
      try {
        const product = await Product.findById(productId);
        if (!product) continue;
        const matchingItem = orderItems.find(
          (item) => item.product.toString() === productId.toString()
        );
        if (!matchingItem) continue;

        const variant = product.variants?.find(
          (v) =>
            (!matchingItem.size || v.size === matchingItem.size) &&
            (!matchingItem.color || v.color === matchingItem.color)
        );
        if (variant) {
          variant.stock += matchingItem.quantity;
          syncTotalStock(product);
        } else {
          product.totalStock += matchingItem.quantity;
        }
        await product.save();
      } catch (rollbackError) {
        console.error('Erreur rollback stock:', rollbackError);
      }
    }
    throw error;
  }
}

function isTransactionUnsupported(error) {
  const message = error?.message || '';
  return (
    error?.code === 20 ||
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set')
  );
}

async function createOrder(orderData, userId = null, idempotencyKey = null) {
  const cleanIdempotency = idempotencyKey && String(idempotencyKey).trim() ? String(idempotencyKey).trim() : null;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      return await createOrderWithTransaction(orderData, userId, cleanIdempotency);
    } catch (error) {
      if (error instanceof OrderServiceError) {
        throw error;
      }

      if (isTransactionUnsupported(error)) {
        console.warn('⚠️ Transactions MongoDB indisponibles — fallback séquentiel');
        try {
          return await createOrderWithSequentialUpdates(orderData, userId, cleanIdempotency);
        } catch (fallbackError) {
          if (fallbackError instanceof OrderServiceError) throw fallbackError;
          if (fallbackError.code === 11000) {
            console.warn(`⚠️ E11000 fallback (essai ${attempts + 1}/${maxAttempts}):`, fallbackError.keyPattern || fallbackError.message);
            attempts++;
            if (attempts < maxAttempts) continue;
          }
          throw new OrderServiceError(
            fallbackError.message || 'Erreur lors de la création de la commande',
            500
          );
        }
      }

      if (error.code === 11000) {
        console.warn(`⚠️ E11000 transaction (essai ${attempts + 1}/${maxAttempts}):`, error.keyPattern || error.message);

        // Si la clé idempotente est en double, tenter de retourner la commande existante
        if (cleanIdempotency && (error.keyPattern?.idempotencyKey || (error.message && error.message.includes('idempotencyKey')))) {
          const existingOrder = await Order.findOne({ idempotencyKey: cleanIdempotency });
          if (existingOrder) return finalizeOrder(existingOrder);
        }

        // Si collision sur numéro de commande ou autre index, réessayer avec un nouveau document
        attempts++;
        if (attempts < maxAttempts) {
          continue;
        }
      }

      throw new OrderServiceError(
        error.message || 'Erreur lors de la création de la commande',
        500
      );
    }
  }

  throw new OrderServiceError(
    'Erreur lors de la création de la commande. Veuillez réessayer.',
    500
  );
}

module.exports = {
  OrderServiceError,
  createOrder,
  mapOrderResponse,
  syncOrderWithFiabilo,
};
