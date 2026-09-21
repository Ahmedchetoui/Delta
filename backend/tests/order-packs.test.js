const { buildOrderItems, OrderServiceError } = require('../services/orderService');

function makeProduct(overrides = {}) {
  const packs = [
    {
      _id: { toString: () => 'pack-4' },
      quantity: 4,
      title: '4 Pull',
      originalPrice: 132,
      discount: 27,
      price: 97,
    },
  ];
  packs.id = (id) => String(id) === 'pack-4' ? packs[0] : null;

  return {
    _id: { toString: () => 'product-1' },
    name: 'Pull',
    pricingMethod: 'pack',
    packs,
    totalStock: 20,
    variants: [],
    colors: [],
    images: [],
    sku: 'PULL-1',
    getFinalPrice: () => 33,
    ...overrides,
  };
}

describe('buildOrderItems — offres par pack', () => {
  test('utilise le prix sécurisé du pack plutôt que le prix unitaire', async () => {
    const product = makeProduct();
    const result = await buildOrderItems(
      [{ product: 'product-1', quantity: 4 }],
      [product],
      'pack-4'
    );

    expect(result.subtotal).toBe(97);
    expect(result.packInfo).toMatchObject({ title: '4 Pull', price: 97, quantity: 4 });
    expect(result.orderItems[0]).toMatchObject({ quantity: 4, price: 24.25, packName: '4 Pull' });
  });

  test('refuse une quantité différente de l’offre choisie', async () => {
    await expect(buildOrderItems(
      [{ product: 'product-1', quantity: 3 }],
      [makeProduct()],
      'pack-4'
    )).rejects.toBeInstanceOf(OrderServiceError);
  });

  test('le mode standard garde son prix unitaire existant', async () => {
    const product = makeProduct({ pricingMethod: 'standard', packs: [] });
    const result = await buildOrderItems(
      [{ product: 'product-1', quantity: 2 }],
      [product]
    );

    expect(result.subtotal).toBe(66);
    expect(result.packInfo).toBeNull();
    expect(result.orderItems[0].packName).toBeNull();
  });
});
