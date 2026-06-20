const SHIPPING_COST = 8;
const FREE_SHIPPING_THRESHOLD = 100;
const MAX_ITEM_QUANTITY = 10;
const MAX_ORDER_ITEMS = 20;
const PAYMENT_METHOD_COD = 'cash_on_delivery';

function calculateShippingCost(subtotal) {
  const amount = Number(subtotal) || 0;
  return amount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

module.exports = {
  SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  MAX_ITEM_QUANTITY,
  MAX_ORDER_ITEMS,
  PAYMENT_METHOD_COD,
  calculateShippingCost,
};
