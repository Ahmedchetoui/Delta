const SHIPPING_COST = 8;
const MAX_ITEM_QUANTITY = 10;
const MAX_ORDER_ITEMS = 20;
const PAYMENT_METHOD_COD = 'cash_on_delivery';

function calculateShippingCost() {
  return SHIPPING_COST;
}

module.exports = {
  SHIPPING_COST,
  MAX_ITEM_QUANTITY,
  MAX_ORDER_ITEMS,
  PAYMENT_METHOD_COD,
  calculateShippingCost,
};
