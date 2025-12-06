const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Script de restauration MongoDB
 * Restaure un backup spécifique de la base de données
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';
const BACKUP_DIR = path.join(__dirname, '../backups');

// Récupérer le nom du backup depuis les arguments
const backupName = process.argv[2];

console.log('🔄 Restauration MongoDB...\n');

try {
    // Vérifier que le dossier backups existe
    if (!fs.existsSync(BACKUP_DIR)) {
        console.error('❌ Aucun backup trouvé. Dossier backups inexistant.\n');
        console.log('💡 Créez d\'abord un backup avec: npm run db:backup\n');
        process.exit(1);
    }

    // Lister les backups disponibles
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup-'))
        .sort()
        .reverse();

    if (backups.length === 0) {
        console.error('❌ Aucun backup disponible.\n');
        console.log('💡 Créez d\'abord un backup avec: npm run db:backup\n');
        process.exit(1);
    }

    let selectedBackup;

    // Si aucun backup spécifié, proposer une liste
    if (!backupName) {
        console.log('📋 Backups disponibles:\n');
        backups.forEach((backup, index) => {
            const backupPath = path.join(BACKUP_DIR, backup);
            const stats = fs.statSync(backupPath);
            const date = new Date(stats.mtime);
            console.log(`  ${index + 1}. ${backup}`);
            console.log(`     Date: ${date.toLocaleString('fr-FR')}\n`);
        });

        console.log('💡 Usage: npm run db:restore <nom-du-backup>');
        console.log(`   Exemple: npm run db:restore ${backups[0]}\n`);
        process.exit(0);
    }

    // Vérifier que le backup existe
    const backupPath = path.join(BACKUP_DIR, backupName);
    if (!fs.existsSync(backupPath)) {
        console.error(`❌ Backup "${backupName}" non trouvé.\n`);
        console.log('📋 Backups disponibles:');
        backups.forEach((backup, index) => {
            console.log(`  ${index + 1}. ${backup}`);
        });
        console.log('');
        process.exit(1);
    }

    selectedBackup = backupPath;

    // Confirmation
    console.log('⚠️  ATTENTION: Cette opération va ÉCRASER toutes les données actuelles!\n');
    console.log(`📦 Backup à restaurer: ${backupName}`);
    console.log(`📍 Emplacement: ${selectedBackup}\n`);

    // En production, on pourrait ajouter une confirmation interactive
    // Pour l'instant, on procède directement

    // Exécuter mongorestore
    console.log('🔄 Restauration en cours...\n');

    const dbName = 'delta-fashion'; // Nom de la base
    const command = `mongorestore --uri="${MONGODB_URI}" --drop "${path.join(selectedBackup, dbName)}"`;

    execSync(command, { stdio: 'inherit' });

    console.log('\n✅ Restauration réussie !\n');
    console.log('🎉 Vos données ont été restaurées.\n');

} catch (error) {
    console.error('\n❌ Erreur lors de la restauration:', error.message);

    if (error.message.includes('mongorestore')) {
        console.error('\n⚠️  mongorestore n\'est pas installé ou pas dans le PATH');
        console.error('📥 Installez MongoDB Database Tools:');
        console.error('   https://www.mongodb.com/try/download/database-tools\n');
    }

    process.exit(1);
}
