/**
 * Script pour optimiser toutes les images existantes dans le dossier uploads
 * Usage: node backend/scripts/optimizeExistingImages.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Configuration
const MAX_SIZE = 1200; // Taille max 1200px
const QUALITY = 80;     // Qualité 80%

async function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            await walkDir(filePath, callback);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                await callback(filePath);
            }
        }
    }
}

async function optimizeImage(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const sizeInMB = stats.size / (1024 * 1024);

        // On n'optimise que si le fichier est assez gros (> 300KB)
        if (sizeInMB < 0.3) {
            console.log(`⏩ Ignoré (déjà petit) : ${path.relative(UPLOADS_DIR, filePath)} (${(stats.size / 1024).toFixed(2)} KB)`);
            return;
        }

        const buffer = fs.readFileSync(filePath);
        const metadata = await sharp(buffer).metadata();

        // On ne redimensionne que si l'image est plus large que MAX_SIZE
        let pipeline = sharp(buffer);
        if (metadata.width > MAX_SIZE || metadata.height > MAX_SIZE) {
            pipeline = pipeline.resize(MAX_SIZE, MAX_SIZE, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        const optimizedBuffer = await pipeline
            .jpeg({ quality: QUALITY, mozjpeg: true })
            .toBuffer();

        const newSizeInKB = optimizedBuffer.length / 1024;

        // On ne remplace que si on a réellement réduit la taille
        if (optimizedBuffer.length < stats.size) {
            fs.writeFileSync(filePath, optimizedBuffer);
            console.log(`✅ Optimisé : ${path.relative(UPLOADS_DIR, filePath)} (${(stats.size / 1024).toFixed(2)} KB -> ${newSizeInKB.toFixed(2)} KB)`);
        } else {
            console.log(`⏩ Conservé original (gain nul) : ${path.relative(UPLOADS_DIR, filePath)}`);
        }
    } catch (error) {
        console.error(`❌ Erreur sur ${filePath}:`, error.message);
    }
}

async function run() {
    console.log('🚀 Démarrage de l\'optimisation des images existantes...');

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.error(`❌ Dossier non trouvé : ${UPLOADS_DIR}`);
        return;
    }

    await walkDir(UPLOADS_DIR, optimizeImage);

    console.log('✨ Terminé ! Toutes les images ont été traitées.');
}

run();
