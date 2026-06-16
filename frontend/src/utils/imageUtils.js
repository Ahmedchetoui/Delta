import { getApiOrigin } from '../config/apiConfig';

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='16'%3EImage%3C/text%3E%3C/svg%3E";

export function resolveImageUrl(src) {
  if (!src) return PLACEHOLDER_IMAGE;
  if (/^https?:\/\//i.test(src)) return src;
  const origin = getApiOrigin();
  if (src.startsWith('/uploads/')) return `${origin}${src}`;
  if (src.startsWith('uploads/')) return `${origin}/${src}`;
  return `${origin}/uploads/${src}`;
}
