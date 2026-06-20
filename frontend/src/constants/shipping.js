export const SHIPPING_COST = 8;
export const FREE_SHIPPING_THRESHOLD = 100;

export function calculateShippingCost(subtotal) {
  const amount = Number(subtotal) || 0;
  return amount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}
