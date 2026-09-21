const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { cloudinary, enabled: useCloudinary, getCloudinaryFolder } = require('../config/cloudinary');

// Configuration du stockage Multer
const storage = (useCloudinary && cloudinary)
  ? multer.memoryStorage()
  : multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = process.env.UPLOAD_PATH || '../uploads';
      const fullPath = path.join(__dirname, uploadPath);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
  // Vérifier le type MIME
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max (avant traitement sharp, pour éviter DoS)
    files: 10 // 10 fichiers max
  }
});

// Uploads de base
const uploadProductImages = upload.array('images', 10);
const uploadSingleImage = upload.single('image');
const uploadAvatar = upload.single('avatar');
const uploadBannerImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 }
]);

// Si Cloudinary est actif, middleware pour envoyer les buffers vers Cloudinary
const uploadBuffersToCloudinary = async (req, res, next) => {
  try {
    if (!(useCloudinary && cloudinary)) return next();
    let files = [];
    if (Array.isArray(req.files)) {
      files = req.files;
    } else if (req.files && typeof req.files === 'object') {
      files = Object.values(req.files).flat();
    } else if (req.file) {
      files = [req.file];
    }
    if (!files.length) return next();
    const folder = getCloudinaryFolder();

    // Traitement séquentiel pour limiter l'empreinte mémoire sur serveurs à ressources limitées (Render 512MB)
    const uploads = [];
    for (const file of files) {
      let processedBuffer = file.buffer;
      const isBanner = file.fieldname === 'image' || file.fieldname === 'mobileImage';
      const isPng = file.mimetype === 'image/png' || /\.png$/i.test(file.originalname || '');

      try {
        if (isBanner) {
          // Bannières : conserver une haute résolution panoramique / portrait
          const pipeline = sharp(file.buffer).resize(2560, 2560, {
            fit: 'inside',
            withoutEnlargement: true,
          });
          processedBuffer = isPng
            ? await pipeline.png({ quality: 90, compressionLevel: 6 }).toBuffer()
            : await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
        } else {
          // Produits : 1200x1200 max
          const pipeline = sharp(file.buffer).resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          });
          processedBuffer = isPng
            ? await pipeline.png({ quality: 80, compressionLevel: 6 }).toBuffer()
            : await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
        }
      } catch (sharpError) {
        console.warn('Erreur lors de l\'optimisation Sharp, utilisation de l\'original:', sharpError.message);
      }

      const streamOptions = {
        folder,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
        invalidate: false,
      };

      // Ne générer des variantes eager 300px/800px que pour les fiches produits
      if (!isBanner) {
        streamOptions.eager = [
          { width: 300, height: 300, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
          { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
        ];
        streamOptions.eager_async = true;
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          streamOptions,
          (err, resCloud) => {
            if (err) return reject(err);
            resolve({ url: resCloud.secure_url, public_id: resCloud.public_id, fieldname: file.fieldname });
          }
        );
        stream.end(processedBuffer);
      });

      uploads.push(result);
    }

    // Sauvegarder les URLs Cloudinary pour usage dans les routes
    req.uploadedImages = uploads; // [{ url, public_id, fieldname }]
    next();
  } catch (err) {
    // Fallback: en cas d'échec Cloudinary, enregistrer localement et continuer
    try {
      console.error('Cloudinary a échoué, fallback vers stockage local:', err?.message || err);
      const baseUploadPath = path.join(__dirname, process.env.UPLOAD_PATH || '../uploads');

      let files = [];
      if (Array.isArray(req.files)) {
        files = req.files;
      } else if (req.files && typeof req.files === 'object') {
        files = Object.values(req.files).flat();
      } else if (req.file) {
        files = [req.file];
      }
      const localUploads = [];
      for (const f of files) {
        const isBanner = f.fieldname === 'image' || f.fieldname === 'mobileImage';
        const targetSubdir = isBanner ? 'banniere' : 'produit';
        const targetDir = path.join(baseUploadPath, targetSubdir);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const isPng = f.mimetype === 'image/png' || /\.png$/i.test(f.originalname || '');
        const ext = isPng ? '.png' : (path.extname(f.originalname || '.jpg') || '.jpg');
        const filename = `${f.fieldname || 'images'}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const full = path.join(targetDir, filename);

        // Optimisation locale si possible en respectant le bon format
        let bufferToSave = f.buffer;
        try {
          if (f.buffer) {
            const maxDim = isBanner ? 2560 : 1200;
            const pipeline = sharp(f.buffer).resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true });
            bufferToSave = isPng
              ? await pipeline.png({ quality: 85, compressionLevel: 6 }).toBuffer()
              : await pipeline.jpeg({ quality: 80 }).toBuffer();
          }
        } catch (e) { /* ignore */ }

        const buffer = bufferToSave || f.buffer || (f.path ? fs.readFileSync(f.path) : null);
        if (!buffer) continue;
        fs.writeFileSync(full, buffer);
        localUploads.push({ url: `${targetSubdir}/${filename}`, fieldname: f.fieldname });
      }
      if (localUploads.length > 0) {
        req.uploadedImages = localUploads;
        return next();
      }
      return next(err);
    } catch (fallbackErr) {
      console.error('Echec du fallback local après erreur Cloudinary:', fallbackErr);
      return next(err);
    }
  }
};

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Fichier trop volumineux. Taille maximale: 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Trop de fichiers. Maximum: 10 fichiers'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Champ de fichier inattendu'
      });
    }
  }

  if (error.message === 'Seules les images sont autorisées') {
    return res.status(400).json({
      message: error.message
    });
  }

  next(error);
};

// Fonction pour supprimer un fichier
const deleteFile = async (ref) => {
  if (!ref) return false;
  // Si c'est une URL Cloudinary, détruire la ressource
  if ((useCloudinary && cloudinary) && /^https?:\/\//i.test(ref) && ref.includes('res.cloudinary.com')) {
    try {
      // Extraire public_id à partir de l'URL
      // Exemple: https://res.cloudinary.com/<cloud>/image/upload/v12345/folder/name.jpg
      const withoutQuery = ref.split('?')[0];
      const parts = withoutQuery.split('/');
      const uploadIndex = parts.findIndex(p => p === 'upload');
      const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (e) {
      console.warn('Erreur suppression Cloudinary:', e?.message);
      return false;
    }
  }

  // Sinon, suppression locale
  const filePath = path.join(__dirname, process.env.UPLOAD_PATH || '../uploads', ref);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Fonction pour obtenir une URL d'image. Les uploads locaux restent relatifs :
// ainsi Vercel les transmet par son rewrite /uploads et le navigateur ne les
// traite jamais comme une image cross-origin Render.
const getImageUrl = (filename) => {
  if (!filename) return null;
  const value = String(filename).trim();

  // Les anciennes données peuvent contenir une URL Render absolue. La ramener
  // à un chemin local évite le CORP `same-origin` des anciens déploiements et
  // conserve le fonctionnement en accès direct à l'API.
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.hostname.endsWith('.onrender.com') && url.pathname.startsWith('/uploads/')) {
        return `${url.pathname}${url.search}`;
      }
    } catch (error) {
      // Une URL externe invalide sera renvoyée telle quelle ; le client pourra
      // utiliser son image de secours.
    }

    // Cloudinary et les autres stockages externes conservent leur URL complète.
    return value;
  }

  return `/uploads/${value.replace(/^\/?uploads\//, '')}`;
};

module.exports = {
  uploadProductImages,
  uploadSingleImage,
  uploadAvatar,
  uploadBannerImages,
  uploadBuffersToCloudinary,
  handleUploadError,
  deleteFile,
  getImageUrl
};
