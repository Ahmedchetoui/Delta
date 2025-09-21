const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importer les modèles
const Category = require('../models/Category');
const Product = require('../models/Product');

const resetCategories = async () => {
  try {
    console.log('🗑️ Suppression et recréation des catégories...');

    // Connexion à MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion');
      console.log('✅ Connecté à MongoDB');
    }

    // 1. Supprimer toutes les catégories existantes
    const deletedCategories = await Category.deleteMany({});
    console.log(`🗑️ ${deletedCategories.deletedCount} catégories supprimées`);

    // 2. Supprimer tous les produits (car ils référencent les catégories)
    const deletedProducts = await Product.deleteMany({});
    console.log(`🗑️ ${deletedProducts.deletedCount} produits supprimés`);

    // 3. Vérifier quelle image est disponible dans le dossier
    const categorieFolder = path.join(__dirname, '../uploads/categorie');
    let availableImages = [];
    
    if (fs.existsSync(categorieFolder)) {
      availableImages = fs.readdirSync(categorieFolder)
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      console.log(`📁 Images trouvées: ${availableImages.join(', ')}`);
    } else {
      console.log('⚠️ Dossier categorie non trouvé');
    }

    // 4. Créer la nouvelle catégorie Enfants
    const enfantsImage = availableImages.length > 0 ? availableImages[0] : null;
    
    const enfantsCategory = new Category({
      name: 'Enfants',
      description: 'Mode pour enfants - Vêtements confortables et tendance',
      icon: 'child',
      order: 1,
      image: enfantsImage ? `categorie/${enfantsImage}` : null,
      isActive: true,
      metaTitle: 'Mode Enfants - Delta Fashion',
      metaDescription: 'Découvrez notre collection de vêtements pour enfants'
    });

    await enfantsCategory.save();
    console.log('👶 Catégorie Enfants créée avec succès');

    if (enfantsImage) {
      console.log(`🖼️ Image utilisée: ${enfantsImage}`);
      console.log(`🔗 URL de l'image: /uploads/categorie/${enfantsImage}`);
    } else {
      console.log('⚠️ Aucune image trouvée dans le dossier categorie');
    }

    console.log('\n🎉 Réinitialisation terminée !');
    console.log('\n📋 Résumé :');
    console.log(`👶 Catégories créées: ${await Category.countDocuments()}`);
    console.log(`🛍️ Produits: ${await Product.countDocuments()}`);
    
    // Afficher les détails de la catégorie créée
    const createdCategory = await Category.findOne({ name: 'Enfants' });
    console.log('\n📄 Détails de la catégorie créée :');
    console.log(`- Nom: ${createdCategory.name}`);
    console.log(`- Description: ${createdCategory.description}`);
    console.log(`- Image: ${createdCategory.image || 'Aucune'}`);
    console.log(`- Slug: ${createdCategory.slug}`);
    console.log(`- Active: ${createdCategory.isActive}`);

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('🔌 Déconnecté de MongoDB');
      process.exit(0);
    }
  }
};

// Exporter la fonction
module.exports = resetCategories;

// Exécuter le script seulement si ce fichier est appelé directement
if (require.main === module) {
  resetCategories();
}
