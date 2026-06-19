import { resolveImageUrl } from './imageUtils';
import { colorsEqual } from './productStock';

export function normalizeProductImageEntry(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const url = entry.trim();
    return url ? { url, color: '' } : null;
  }
  if (typeof entry === 'object' && entry.url) {
    return {
      url: String(entry.url).trim(),
      color: String(entry.color || '').trim(),
    };
  }
  return null;
}

export function normalizeProductImages(images = []) {
  if (!Array.isArray(images)) return [];
  return images.map(normalizeProductImageEntry).filter(Boolean);
}

export function getProductImageUrl(entry, width = 800) {
  const normalized = normalizeProductImageEntry(entry);
  return resolveImageUrl(normalized?.url, width);
}

export function getFirstProductImageUrl(images = [], width = 800) {
  const normalized = normalizeProductImages(images);
  if (!normalized.length) return resolveImageUrl(null, width);
  return getProductImageUrl(normalized[0], width);
}

export function getImagesForColor(images = [], colorName = '') {
  const normalized = normalizeProductImages(images);
  if (!colorName) return normalized;

  const matching = normalized.filter((img) => colorsEqual(img.color, colorName));
  if (matching.length > 0) return matching;

  const general = normalized.filter((img) => !img.color);
  return general.length > 0 ? general : normalized;
}

export function findImageIndexForColor(images = [], colorName = '') {
  const gallery = getImagesForColor(images, colorName);
  if (!gallery.length) return 0;

  const normalized = normalizeProductImages(images);
  const index = normalized.findIndex(
    (img) => img.url === gallery[0].url && colorsEqual(img.color, gallery[0].color)
  );
  return index >= 0 ? index : 0;
}
