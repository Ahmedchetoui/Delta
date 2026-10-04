import { getApiOrigin } from '../config/apiConfig';

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='16'%3EImage%3C/text%3E%3C/svg%3E";

export function optimizeImageUrl(src, width = 800) {
  if (!src || !/^https?:\/\//i.test(src)) return src;
  if (src.includes('images.unsplash.com') && !src.includes('w=')) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}&q=75&auto=format&fit=crop`;
  }
  if (src.includes('images.unsplash.com') && !src.includes('q=')) {
    return `${src}${src.includes('?') ? '&' : '?'}q=75&auto=format`;
  }
  if (src.includes('res.cloudinary.com') && src.includes('/upload/') && !src.includes('/upload/f_')) {
    return src.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  return src;
}

function appendCacheBuster(url, cacheKey) {
  if (!url || !cacheKey) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(cacheKey)}`;
}

export function resolveImageUrl(src, width = 800, cacheKey) {
  if (!src) return PLACEHOLDER_IMAGE;
  let url;
  if (/^https?:\/\//i.test(src)) {
    url = optimizeImageUrl(src, width);
  } else {
    const origin = getApiOrigin();
    if (src.startsWith('/uploads/')) url = `${origin}${src}`;
    else if (src.startsWith('uploads/')) url = `${origin}/${src}`;
    else url = `${origin}/uploads/${src}`;
  }
  return appendCacheBuster(url, cacheKey);
}

export function getResponsiveImageSrcSet(src, widths, cacheKey) {
  if (!src || !Array.isArray(widths) || widths.length === 0) return undefined;
  // Seules les images servies par Cloudinary ou Unsplash peuvent être redimensionnées dynamiquement via URL.
  // Pour les uploads locaux, renvoyer undefined évite que le navigateur n'envoie 4 requêtes concurrentes inutiles.
  const isCdn = src.includes('res.cloudinary.com') || src.includes('images.unsplash.com');
  if (!isCdn) return undefined;

  return widths
    .map((width) => `${resolveImageUrl(src, width, cacheKey)} ${width}w`)
    .join(', ');
}

/**
 * Compresse et redimensionne une image côté client avant l'envoi au serveur.
 * Réduit les photos de smartphone haute résolution (ex: 6-12 Mo) à environ 150-250 Ko
 * avec une excellente qualité visuelle (1200px max, JPEG q=0.85).
 * Évite les rejets 413 (Payload Too Large), les blocages Vercel (limite 4.5 Mo) et les timeouts réseau.
 */
export async function compressImageFile(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = {}) {
  if (!file || !(file instanceof Blob) || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Ne pas compresser les SVG ou les fichiers déjà très légers (< 250 Ko)
  if (file.type === 'image/svg+xml' || file.size < 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                resolve(file);
                return;
              }
              const cleanName = (file.name || 'image.jpg').replace(/\.[^/.]+$/, '.jpg');
              const compressedFile = new File([blob], cleanName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        } catch {
          resolve(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
