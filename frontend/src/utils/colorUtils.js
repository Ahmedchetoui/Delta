export const PRESET_COLORS = [
  { name: 'Noir', code: '#111827' },
  { name: 'Blanc', code: '#ffffff' },
  { name: 'Bleu', code: '#2563eb' },
  { name: 'Marine', code: '#1e3a8a' },
  { name: 'Vert', code: '#22c55e' },
  { name: 'Rouge', code: '#ef4444' },
  { name: 'Marron', code: '#92400e' },
  { name: 'Beige', code: '#e7dac7' },
  { name: 'Gris', code: '#9ca3af' },
  { name: 'Jaune', code: '#eab308' },
  { name: 'Rose', code: '#ec4899' },
  { name: 'Kaki', code: '#786f52' },
];

export function colorNameToHex(name) {
  const key = (name || '').toLowerCase();
  const preset = PRESET_COLORS.find((c) => c.name.toLowerCase() === key);
  if (preset) return preset.code;

  const map = Object.fromEntries(PRESET_COLORS.map((c) => [c.name.toLowerCase(), c.code]));

  if (key.includes('bleu') && key.includes('marine')) return '#1e3a8a';
  if (key.includes('blanc') && key.includes('gris')) return '#d1d5db';
  if (key.includes('jaune') && key.includes('vert')) return '#a3b18a';

  for (const [label, hex] of Object.entries(map)) {
    if (key.includes(label)) return hex;
  }

  if (/^#[0-9a-f]{3,8}$/i.test(key)) return name;
  return '#9ca3af';
}

export function normalizeProductColors(colors = [], variants = []) {
  if (colors.length > 0) {
    return colors.map((color) => {
      if (typeof color === 'string') {
        return { name: color, code: colorNameToHex(color) };
      }
      return {
        name: color.name,
        code: color.code || colorNameToHex(color.name),
      };
    });
  }

  const names = [...new Set(
    variants.map((v) => String(v.color || '').trim()).filter(Boolean)
  )];
  return names.map((name) => ({ name, code: colorNameToHex(name) }));
}

export function colorsFromVariants(variants = []) {
  return normalizeProductColors([], variants);
}
