const cloudinary = require('cloudinary').v2;

function parseCloudinaryUrl(url) {
  if (!url || !url.startsWith('cloudinary://')) return null;
  const withoutScheme = url.replace(/^cloudinary:\/\//, '');
  const atIndex = withoutScheme.lastIndexOf('@');
  if (atIndex === -1) return null;

  const credentials = withoutScheme.slice(0, atIndex);
  const cloudName = withoutScheme.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(':');
  if (colonIndex === -1) return null;

  const apiKey = credentials.slice(0, colonIndex);
  const apiSecret = credentials.slice(colonIndex + 1);
  if (!apiKey || !apiSecret || !cloudName) return null;

  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
}

const DEFAULT_CLOUD_NAME = 'dhfxby62c';
const DEFAULT_API_KEY = '947652332343198';
const DEFAULT_API_SECRET = 'mm-zIGJdbaYRmOIVfT22SELqv1k';
const DEFAULT_FOLDER = 'delta-fashion/uploads';

function initCloudinary() {
  const rawUrl = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || DEFAULT_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || DEFAULT_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || DEFAULT_FOLDER;

  try {
    if (rawUrl) {
      const parsed = parseCloudinaryUrl(rawUrl);
      if (parsed) {
        cloudinary.config({ ...parsed, secure: true });
        return {
          cloudinary,
          enabled: true,
          mode: 'cloudinary',
          folder,
          cloudName: cloudinary.config().cloud_name,
        };
      }
    }

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      return {
        cloudinary,
        enabled: true,
        mode: 'cloudinary',
        folder,
        cloudName: cloudinary.config().cloud_name,
      };
    }

    return { cloudinary: null, enabled: false, mode: 'local' };
  } catch (error) {
    console.warn('⚠️  Cloudinary non disponible:', error.message);
    return { cloudinary: null, enabled: false, mode: 'local' };
  }
}

const cloudinaryState = initCloudinary();

async function verifyCloudinaryConnection() {
  if (!cloudinaryState.enabled) {
    return { ok: false, mode: 'local', message: 'Cloudinary non configuré' };
  }

  try {
    await cloudinaryState.cloudinary.api.ping();
    return {
      ok: true,
      mode: 'cloudinary',
      cloudName: cloudinaryState.cloudName,
      folder: cloudinaryState.folder,
    };
  } catch (error) {
    return {
      ok: false,
      mode: 'cloudinary',
      message: error.message,
    };
  }
}

module.exports = {
  ...cloudinaryState,
  verifyCloudinaryConnection,
  getCloudinaryFolder: () => cloudinaryState.folder || 'delta-fashion/uploads',
};
