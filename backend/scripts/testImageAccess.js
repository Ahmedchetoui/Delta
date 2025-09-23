const express = require('express');
const path = require('path');
const fs = require('fs');

// Test simple pour vérifier l'accès aux images
function testImageAccess() {
  console.log('🔍 Test d\'accès aux images...\n');

  // 1. Vérifier que le fichier existe
  const imagePath = path.join(__dirname, '..', 'uploads', 'categorie', 'enfants.jpg');
  console.log(`📁 Chemin complet: ${imagePath}`);
  
  if (fs.existsSync(imagePath)) {
    const stats = fs.statSync(imagePath);
    console.log(`✅ Fichier trouvé (${stats.size} bytes)`);
  } else {
    console.log('❌ Fichier non trouvé');
    return;
  }

  // 2. Vérifier la configuration du serveur statique
  console.log('\n📋 Configuration serveur statique:');
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  console.log(`   Dossier uploads: ${uploadsDir}`);
  console.log(`   URL attendue: /uploads/categorie/enfants.jpg`);

  // 3. Lister le contenu du dossier categorie
  const categorieDir = path.join(uploadsDir, 'categorie');
  if (fs.existsSync(categorieDir)) {
    const files = fs.readdirSync(categorieDir);
    console.log(`\n📂 Contenu du dossier categorie:`);
    files.forEach(file => {
      const filePath = path.join(categorieDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${stats.size} bytes)`);
    });
  }

  // 4. Créer un serveur de test rapide
  const app = express();
  
  // Configuration identique au serveur principal
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  
  const PORT = 3001;
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Serveur de test démarré sur http://localhost:${PORT}`);
    console.log(`🖼️ Test de l'image: http://localhost:${PORT}/uploads/categorie/enfants.jpg`);
    console.log('\n💡 Ouvrez cette URL dans votre navigateur pour tester l\'accès à l\'image');
    console.log('⏹️ Appuyez sur Ctrl+C pour arrêter le serveur de test');
  });

  // Arrêter le serveur après 30 secondes
  setTimeout(() => {
    server.close();
    console.log('\n🛑 Serveur de test arrêté');
  }, 30000);
}

if (require.main === module) {
  testImageAccess();
}

module.exports = testImageAccess;
