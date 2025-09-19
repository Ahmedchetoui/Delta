const multer = require('multer');
const path = require('path');
const fs = require('fs');
let cloudinary = null;

// Détection Cloudinary via variables d'environnement
const useCloudinary = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (useCloudinary) {
  try {
    cloudinary = require('cloudinary').v2;
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  } catch (e) {
    console.warn('Cloudinary non disponible, bascule sur stockage local.', e?.message);
  }
}

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
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 10 // 10 fichiers max
  }
});

// Uploads de base
const uploadProductImages = upload.array('images', 10);
const uploadSingleImage = upload.single('image');
const uploadAvatar = upload.single('avatar');

// Si Cloudinary est actif, middleware pour envoyer les buffers vers Cloudinary
const uploadBuffersToCloudinary = async (req, res, next) => {
  try {
    if (!(useCloudinary && cloudinary)) return next();
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return next();
    const folder = process.env.CLOUDINARY_FOLDER || 'delta-fashion/uploads';

    const uploads = await Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'image' },
          (err, result) => {
            if (err) return reject(err);
            resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(file.buffer);
      });
    }));

    // Sauvegarder les URLs Cloudinary pour usage dans les routes
    req.uploadedImages = uploads; // [{ url, public_id }]
    next();
  } catch (err) {
    next(err);
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

// Fonction pour obtenir une URL d'image (relative pour éviter les soucis d'hôte)
const getImageUrl = (filename) => {
  if (!filename) return null;
  // Si c'est déjà une URL complète (Cloudinary par ex.), la renvoyer telle quelle
  if (/^https?:\/\//i.test(filename)) return filename;
  return `/uploads/${filename}`;
};

module.exports = {
  uploadProductImages,
  uploadSingleImage,
  uploadAvatar,
  uploadBuffersToCloudinary,
  handleUploadError,
  deleteFile,
  getImageUrl
};
