export const FB_PIXEL_ID = '1362539488813579';

export function fbq(...args) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

/**
 * Triggers PageView on SPA route changes
 */
export function trackPageView() {
  fbq('track', 'PageView');
}

/**
 * Triggers ViewContent when a user views a product page
 */
export function trackViewContent(product) {
  if (!product) return;
  const price = product.finalPrice ?? product.price ?? 0;
  fbq('track', 'ViewContent', {
    content_name: product.name,
    content_ids: [String(product._id || product.id)],
    content_type: 'product',
    value: price,
    currency: 'TND',
  });
}

/**
 * Triggers AddToCart when a product is ordered / added to cart
 */
export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  const price = product.finalPrice ?? product.price ?? 0;
  fbq('track', 'AddToCart', {
    content_name: product.name,
    content_ids: [String(product._id || product.id)],
    content_type: 'product',
    value: price * quantity,
    currency: 'TND',
  });
}

/**
 * Triggers InitiateCheckout when starting checkout
 */
export function trackInitiateCheckout(items = [], totalValue = 0) {
  fbq('track', 'InitiateCheckout', {
    content_ids: items.map((i) => String(i.product?._id || i.product || i.id)),
    num_items: items.length,
    value: totalValue,
    currency: 'TND',
  });
}

/**
 * Triggers Purchase when order is confirmed
 */
export function trackPurchase(orderNumber, totalValue = 0) {
  fbq('track', 'Purchase', {
    value: totalValue,
    currency: 'TND',
    order_id: String(orderNumber || ''),
  });
}
