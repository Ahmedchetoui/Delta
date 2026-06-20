export function getVariantColorNames(variants = []) {
  return [...new Set(variants.map((v) => v.color).filter(Boolean))];
}

export function hasImageForColor(images = [], colorName) {
  if (!colorName) return false;
  return images.some((img) => img.color === colorName);
}

export function syncProductColorsChange(prevForm, colors) {
  const colorNames = new Set(colors.map((c) => c.name));
  return {
    ...prevForm,
    colors,
    images: prevForm.images.map((img) =>
      img.color && !colorNames.has(img.color) ? { ...img, color: '' } : img
    ),
    variants: prevForm.variants.map((v) =>
      v.color && !colorNames.has(v.color) ? { ...v, color: '' } : v
    ),
  };
}
