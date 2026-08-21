export const FB_PIXEL_ID = '1362539488813579';

export function fbq(...args) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

/**
 * Garantit que la valeur est un nombre strict et valide pour Meta Pixel (ex: 33.00)
 */
function toValidNumber(val) {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Suivi de la vue de page
 */
export function trackPageView() {
  fbq('track', 'PageView');
}

/**
 * Suivi de la consultation produit (ViewContent)
 */
export function trackViewContent(product) {
  if (!product) return;
  const price = toValidNumber(product.finalPrice ?? product.price ?? 0);
  fbq('track', 'ViewContent', {
    content_name: String(product.name || ''),
    content_ids: [String(product._id || product.id || '')],
    content_type: 'product',
    value: price,
    currency: 'TND',
  });
}

/**
 * Suivi de l'ajout au panier (AddToCart)
 */
export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  const price = toValidNumber(product.finalPrice ?? product.price ?? 0);
  const qty = parseInt(quantity, 10) || 1;
  fbq('track', 'AddToCart', {
    content_name: String(product.name || ''),
    content_ids: [String(product._id || product.id || '')],
    content_type: 'product',
    value: toValidNumber(price * qty),
    currency: 'TND',
  });
}

/**
 * Suivi du démarrage de commande (InitiateCheckout)
 */
export function trackInitiateCheckout(items = [], totalValue = 0) {
  const validItems = Array.isArray(items) ? items : [];
  fbq('track', 'InitiateCheckout', {
    content_ids: validItems.map((i) => String(i?.product?._id || i?.product || i?.id || '')),
    num_items: validItems.length,
    value: toValidNumber(totalValue),
    currency: 'TND',
  });
}

/**
 * Suivi d'achat confirmé (Purchase)
 */
export function trackPurchase(orderNumber, totalValue = 0) {
  const value = toValidNumber(totalValue);
  fbq('track', 'Purchase', {
    value: value,
    currency: 'TND',
    order_id: String(orderNumber || ''),
  });
}
