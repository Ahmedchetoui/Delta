export function normalizeCartColors(item) {
  if (Array.isArray(item.colors) && item.colors.length > 0) {
    return item.colors;
  }
  if (item.color) {
    return Array(item.quantity || 1).fill(item.color);
  }
  return [];
}

export function formatColorsLabel(colors = []) {
  if (!colors.length) return '';

  const counts = colors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([color, count]) => (count > 1 ? `${color} ×${count}` : color))
    .join(', ');
}

export function expandCartItemForOrder(item) {
  const colors = normalizeCartColors(item);

  if (colors.length > 0) {
    const byColor = colors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(byColor).map(([color, quantity]) => ({
      product: item.product._id,
      quantity,
      size: item.size || null,
      color,
    }));
  }

  return [{
    product: item.product._id,
    quantity: item.quantity,
    size: item.size || null,
    color: item.color || null,
  }];
}

export function buildCartItemId(productId, size, colors = []) {
  const colorKey = colors.length > 0 ? colors.join('|') : 'default';
  return `${productId}-${size || 'default'}-${colorKey}`;
}
