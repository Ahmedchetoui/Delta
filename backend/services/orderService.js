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

async function syncOrderWithFiabilo(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    const result = await createFiabiloShipment(order);
    if (!result) return;

    order.fiabilo = {
      trackingCode: result.trackingCode,
      labelUrl: result.labelUrl,
      status: 'En attente',
      error: null,
      syncedAt: new Date(),
    };
    await order.save();
  } catch (error) {
    console.error(`[Fiabilo] Échec sync commande ${orderId}:`, error.message);
    await Order.findByIdAndUpdate(orderId, {
      fiabilo: {
        error: error.message,
        syncedAt: new Date(),
      },
    });
  }
}

async function finalizeOrder(order) {
  await syncOrderWithFiabilo(order._id);
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

async function createOrderWithTransaction(orderData, userId) {
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

    const productIds = items.map((item) => item.product);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).session(session);

    if (products.length !== productIds.length) {
      throw new OrderServiceError('Un ou plusieurs produits ne sont pas disponibles', 400);
    }

    const { orderItems, subtotal } = await buildOrderItems(items, products);
    const shippingCost = calculateShippingCost(subtotal);
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    await deductStockForItems(orderItems, session);

    const order = new Order({
      user: userId || null,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: PAYMENT_METHOD_COD,
      subtotal,
      shippingCost,
      tax,
      total,
      notes,
      isGift: isGift === true,
      giftMessage,
      guestEmail: userId ? null : shippingAddress.email,
      stockDeducted: true,
    });

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

async function createOrderWithSequentialUpdates(orderData, userId) {
  const {
    items,
    shippingAddress,
    billingAddress,
    notes,
    isGift,
    giftMessage,
  } = orderData;

  const productIds = items.map((item) => item.product);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  });

  if (products.length !== productIds.length) {
    throw new OrderServiceError('Un ou plusieurs produits ne sont pas disponibles', 400);
  }

  const { orderItems, subtotal } = await buildOrderItems(items, products);
  const shippingCost = calculateShippingCost(subtotal);
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

    const order = new Order({
      user: userId || null,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: PAYMENT_METHOD_COD,
      subtotal,
      shippingCost,
      tax,
      total,
      notes,
      isGift: isGift === true,
      giftMessage,
      guestEmail: userId ? null : shippingAddress.email,
      stockDeducted: true,
    });

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

async function createOrder(orderData, userId = null) {
  try {
    return await createOrderWithTransaction(orderData, userId);
  } catch (error) {
    if (error instanceof OrderServiceError) {
      throw error;
    }

    if (isTransactionUnsupported(error)) {
      console.warn('⚠️ Transactions MongoDB indisponibles — fallback séquentiel');
      try {
        return await createOrderWithSequentialUpdates(orderData, userId);
      } catch (fallbackError) {
        if (fallbackError instanceof OrderServiceError) throw fallbackError;
        throw new OrderServiceError(
          fallbackError.message || 'Erreur lors de la création de la commande',
          500
        );
      }
    }

    if (error.code === 11000) {
      throw new OrderServiceError(
        'Conflit lors de la création de la commande. Réessayez.',
        409
      );
    }

    throw new OrderServiceError(
      error.message || 'Erreur lors de la création de la commande',
      500
    );
  }
}

module.exports = {
  OrderServiceError,
  createOrder,
  mapOrderResponse,
};
