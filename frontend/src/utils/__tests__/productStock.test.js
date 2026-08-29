import {
  colorHasAvailableStock,
  getAvailableColors,
} from '../productStock';

const colors = [
  { name: 'Noir', code: '#111827' },
  { name: 'Bleu', code: '#2563eb' },
  { name: 'Rouge', code: '#ef4444' },
];

describe('product stock by color', () => {
  test('keeps only colors with stock in at least one size', () => {
    const product = {
      inStock: true,
      variants: [
        { size: '10', color: 'Noir', inStock: false },
        { size: '12', color: 'Noir', inStock: false },
        { size: '10', color: 'Bleu', inStock: true },
        { size: '12', color: 'Bleu', inStock: false },
        { size: '14', color: 'Rouge', inStock: true },
      ],
    };

    expect(getAvailableColors(colors, product).map((color) => color.name)).toEqual([
      'Bleu',
      'Rouge',
    ]);
    expect(colorHasAvailableStock(product, 'Noir')).toBe(false);
  });

  test('keeps configured colors when stock is not managed by color', () => {
    const product = {
      inStock: true,
      variants: [
        { size: 'M', color: '', inStock: true },
        { size: 'L', color: '', inStock: false },
      ],
    };

    expect(getAvailableColors(colors, product)).toEqual(colors);
  });
});
