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

function initCloudinary() {
  const hasSeparateVars = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  const hasUrl = !!process.env.CLOUDINARY_URL;

  if (!hasSeparateVars && !hasUrl) {
    return { cloudinary: null, enabled: false, mode: 'local' };
  }

  try {
    if (hasSeparateVars) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    } else {
      const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
      if (!parsed) {
        console.warn('⚠️  CLOUDINARY_URL invalide — format attendu: cloudinary://api_key:api_secret@cloud_name');
        return { cloudinary: null, enabled: false, mode: 'local' };
      }
      cloudinary.config({ ...parsed, secure: true });
    }

    return {
      cloudinary,
      enabled: true,
      mode: 'cloudinary',
      folder: process.env.CLOUDINARY_FOLDER || 'delta-fashion/uploads',
      cloudName: cloudinary.config().cloud_name,
    };
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
