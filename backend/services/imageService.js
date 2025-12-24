const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configuration pour les tailles d'images optimisées
const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  small: { width: 500, height: 500 },
  medium: { width: 800, height: 800 },
  large: { width: 1200, height: 1200 },
};

const QUALITY_SETTINGS = {
  webp: { quality: 75, alphaQuality: 75 },
  jpeg: { quality: 80, mozjpeg: true, progressive: true },
  png: { compressionLevel: 9 },
};

/**
 * Génère les URLs optimisées pour les images selon leur source
 */
const getOptimizedImageUrl = (imageUrl, size = 'medium') => {
  if (!imageUrl) return null;

  // Si c'est une URL Cloudinary
  if (imageUrl.includes('cloudinary')) {
    // Utiliser les transformations Cloudinary
    const cloudinaryTransforms = {
      thumbnail: 'w_300,h_300,c_fill,q_auto:best,f_auto',
      small: 'w_500,h_500,c_fill,q_auto:best,f_auto',
      medium: 'w_800,h_800,c_fill,q_auto:best,f_auto',
      large: 'w_1200,h_1200,c_fill,q_auto:best,f_auto',
    };

    const transform = cloudinaryTransforms[size] || cloudinaryTransforms.medium;
    
    // Injecter les transformations dans l'URL Cloudinary
    return imageUrl.replace(
      /\/upload\//,
      `/upload/${transform}/`
    );
  }

  // Si c'est une URL locale (commence par /uploads)
  if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads')) {
    // Retourner l'URL avec un paramètre de cache-breaking
    const normalizedUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${normalizedUrl}?size=${size}&v=${Date.now()}`;
  }

  // Sinon, retourner telle quelle
  return imageUrl;
};

/**
 * Optimise une image uploadée en créant plusieurs variantes
 */
const optimizeUploadedImage = async (buffer, originalName) => {
  try {
    const baseNameWithoutExt = path.parse(originalName).name;
    const optimized = {};

    // Créer les variantes redimensionnées
    for (const [sizeKey, dimensions] of Object.entries(IMAGE_SIZES)) {
      try {
        const optimizedBuffer = await sharp(buffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center',
            withoutEnlargement: false,
          })
          .webp(QUALITY_SETTINGS.webp)
          .toBuffer();

        optimized[sizeKey] = {
          buffer: optimizedBuffer,
          format: 'webp',
          filename: `${baseNameWithoutExt}-${sizeKey}.webp`,
          size: optimizedBuffer.length,
        };
      } catch (err) {
        console.warn(`Erreur lors de l'optimisation ${sizeKey}:`, err.message);
      }
    }

    // Créer aussi une version JPEG de secours
    try {
      const jpegBuffer = await sharp(buffer)
        .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: false,
        })
        .jpeg(QUALITY_SETTINGS.jpeg)
        .toBuffer();

      optimized.jpeg = {
        buffer: jpegBuffer,
        format: 'jpeg',
        filename: `${baseNameWithoutExt}-large.jpg`,
        size: jpegBuffer.length,
      };
    } catch (err) {
      console.warn('Erreur lors de la création du JPEG:', err.message);
    }

    console.log(`✅ Image optimisée: ${originalName}`);
    console.log(`   Tailles: ${Object.entries(optimized).map(([k, v]) => `${k}=${(v.size / 1024).toFixed(1)}KB`).join(', ')}`);

    return optimized;
  } catch (err) {
    console.error('Erreur lors de l\'optimisation:', err.message);
    return null;
  }
};

/**
 * Stocke une image optimisée localement ou sur Cloudinary
 */
const storeOptimizedImage = async (imageData, folder = 'delta-fashion/uploads') => {
  const useCloudinary = !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

  if (useCloudinary && cloudinary) {
    // Stocker sur Cloudinary avec les bonnes options
    return uploadToCloudinary(imageData, folder);
  } else {
    // Stocker localement
    return storeLocally(imageData, folder);
  }
};

/**
 * Upload vers Cloudinary avec optimisations
 */
const uploadToCloudinary = async (imageData, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto', // Cloudinary choisit la meilleure qualité
        fetch_format: 'auto', // Format automatique (WebP si supporté)
        flags: 'progressive', // Progressif pour JPEG
        eager: [
          { width: 300, height: 300, crop: 'fill', format: 'webp' },
          { width: 500, height: 500, crop: 'fill', format: 'webp' },
          { width: 800, height: 800, crop: 'fill', format: 'webp' },
        ],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        });
      }
    );

    uploadStream.end(imageData.buffer);
  });
};

/**
 * Stockage local des images optimisées
 */
const storeLocally = async (imageData, folder) => {
  const uploadPath = path.join(__dirname, '../uploads', folder);
  
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const filename = imageData.filename;
  const filepath = path.join(uploadPath, filename);
  
  fs.writeFileSync(filepath, imageData.buffer);

  // Retourner l'URL relative
  return {
    url: `/uploads/${folder}/${filename}`,
    filename,
    size: imageData.size,
  };
};

/**
 * Obtient l'URL optimisée pour une image avec supportdetailles multiples
 */
const getImageUrls = (baseUrl, availableSizes = ['thumbnail', 'small', 'medium', 'large']) => {
  const urls = {};
  
  for (const size of availableSizes) {
    urls[size] = getOptimizedImageUrl(baseUrl, size);
  }

  return urls;
};

module.exports = {
  IMAGE_SIZES,
  QUALITY_SETTINGS,
  getOptimizedImageUrl,
  optimizeUploadedImage,
  storeOptimizedImage,
  uploadToCloudinary,
  storeLocally,
  getImageUrls,
};
