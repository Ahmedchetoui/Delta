const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Script de backup MongoDB
 * Crée un backup complet de la base de données Delta Fashion
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';
const BACKUP_DIR = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

console.log('🔄 Début du backup MongoDB...\n');

try {
    // Créer le dossier backups s'il n'existe pas
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log('📁 Dossier backups créé\n');
    }

    // Exécuter mongodump
    console.log(`📦 Backup en cours vers: ${backupPath}\n`);

    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;
    execSync(command, { stdio: 'inherit' });

    console.log('\n✅ Backup réussi !\n');
    console.log(`📍 Emplacement: ${backupPath}`);
    console.log(`📊 Timestamp: ${timestamp}\n`);

    // Lister tous les backups
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup-'))
        .sort()
        .reverse();

    if (backups.length > 0) {
        console.log('📋 Backups disponibles:');
        backups.slice(0, 5).forEach((backup, index) => {
            const backupSize = getDirectorySize(path.join(BACKUP_DIR, backup));
            console.log(`  ${index + 1}. ${backup} (${formatBytes(backupSize)})`);
        });

        if (backups.length > 5) {
            console.log(`  ... et ${backups.length - 5} autre(s)\n`);
        }
    }

    console.log('\n💡 Pour restaurer ce backup, exécutez:');
    console.log(`   npm run db:restore backup-${timestamp}\n`);

} catch (error) {
    console.error('\n❌ Erreur lors du backup:', error.message);

    if (error.message.includes('mongodump')) {
        console.error('\n⚠️  mongodump n\'est pas installé ou pas dans le PATH');
        console.error('📥 Installez MongoDB Database Tools:');
        console.error('   https://www.mongodb.com/try/download/database-tools\n');
    }

    process.exit(1);
}

// Utilitaires
function getDirectorySize(dirPath) {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getDirectorySize(filePath);
            } else {
                size += stats.size;
            }
        });
    } catch (err) {
        console.error('Erreur calcul taille:', err.message);
    }
    return size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
