const {
  getAvailableStock,
  findVariant,
  applyStockDeduction,
} = require('../utils/stockUtils');

function makeProduct(variants) {
  return {
    name: 'Robe enfant',
    totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
    variants,
    colors: [{ name: 'Vert' }, { name: 'Bleu' }, { name: 'Noir' }],
  };
}

describe('stockUtils — stock par couleur et taille', () => {
  const product = makeProduct([
    { size: '12', color: 'Vert', stock: 50 },
    { size: '8', color: 'Bleu', stock: 4 },
    { size: '14', color: 'Noir', stock: 0 },
  ]);

  test('retourne le stock exact pour une combinaison couleur + taille', () => {
    expect(getAvailableStock(product, '12', 'Vert')).toBe(50);
    expect(getAvailableStock(product, '8', 'Bleu')).toBe(4);
    expect(getAvailableStock(product, '14', 'Noir')).toBe(0);
  });

  test('retourne 0 si la couleur demandée est en rupture pour cette taille', () => {
    expect(getAvailableStock(product, '14', 'Vert')).toBe(0);
    expect(getAvailableStock(product, '8', 'Noir')).toBe(0);
  });

  test('ne déduit pas une autre couleur si la variante exacte est en rupture', () => {
    const copy = makeProduct([
      { size: '14', color: 'Noir', stock: 0 },
      { size: '14', color: 'Vert', stock: 10 },
    ]);

    expect(findVariant(copy, '14', 'Noir')).toEqual(
      expect.objectContaining({ color: 'Noir', stock: 0 })
    );

    expect(() =>
      applyStockDeduction(copy, { size: '14', color: 'Noir', quantity: 1 })
    ).toThrow(/Stock insuffisant/);

    expect(copy.variants.find((v) => v.color === 'Vert').stock).toBe(10);
  });
});
