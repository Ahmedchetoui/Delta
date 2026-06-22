function normalizeProductImageEntry(entry) {
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

function normalizeProductImages(images = []) {
  if (!Array.isArray(images)) return [];
  return images.map(normalizeProductImageEntry).filter(Boolean);
}

function buildImagesFromUploads(urls = [], colors = []) {
  return urls.map((url, index) => ({
    url,
    color: colors[index] ? String(colors[index]).trim() : '',
  }));
}

function parseImageColors(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeExistingAndNewImages(existingRaw, newUrls, newColors = []) {
  const existing = normalizeProductImages(
    typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw
  );
  const uploaded = buildImagesFromUploads(newUrls, newColors);
  return [...existing, ...uploaded];
}

function colorsEqual(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

/** URL ou nom de fichier à enregistrer sur une ligne de commande */
function getOrderItemImage(productImages = [], color = '') {
  const normalized = normalizeProductImages(productImages);
  if (!normalized.length) return null;

  if (color) {
    const match = normalized.find((img) => colorsEqual(img.color, color));
    if (match) return match.url;
    const general = normalized.find((img) => !img.color);
    if (general) return general.url;
  }

  return normalized[0].url;
}

module.exports = {
  normalizeProductImageEntry,
  normalizeProductImages,
  buildImagesFromUploads,
  parseImageColors,
  mergeExistingAndNewImages,
  getOrderItemImage,
};
