const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importer les modèles
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Données de test
const seedData = async () => {
  try {
    console.log('🌱 Début du peuplement de la base de données...');

    // Connexion à MongoDB seulement si pas déjà connecté
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion');
      console.log('✅ Connecté à MongoDB');
    } else {
      console.log('✅ Utilisation de la connexion MongoDB existante');
    }

    // Nettoyer les données existantes
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🧹 Données existantes supprimées');

    // 1. Créer un utilisateur admin
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'Delta Fashion',
      email: 'admin@deltafashion.com',
      password: 'admin123',
      phone: '+216 12 345 678',
      role: 'admin',
      address: {
        street: '123 Rue de la Mode',
        city: 'Tunis',
        postalCode: '1000',
        country: 'Tunisie'
      }
    });
    await adminUser.save();
    console.log('👤 Utilisateur admin créé');

    // 2. Créer un utilisateur normal pour tester la connexion
    const testUser = new User({
      firstName: 'Ahmed',
      lastName: 'Chetoui',
      email: 'ahmedchetoui987@gmail.com',
      password: 'test123',
      phone: '+216 98 765 432',
      role: 'user',
      address: {
        street: '456 Avenue de la Liberté',
        city: 'Tunis',
        postalCode: '1002',
        country: 'Tunisie'
      }
    });
    await testUser.save();
    console.log('👤 Utilisateur test créé');

    // 3. Créer des catégories
    const categories = [
      {
        name: 'Hommes',
        description: 'Mode masculine tendance',
        icon: 'male',
        order: 1
      },
      {
        name: 'Femmes',
        description: 'Mode féminine élégante',
        icon: 'female',
        order: 2
      },
      {
        name: 'Enfants',
        description: 'Mode pour enfants',
        icon: 'child',
        order: 3
      },
      {
        name: 'Accessoires',
        description: 'Accessoires de mode',
        icon: 'accessory',
        order: 4
      }
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
    }
    console.log('📂 Catégories créées');

    // 4. Créer des sous-catégories
    const subCategories = [
      // Sous-catégories Hommes
      {
        name: 'T-shirts Homme',
        description: 'T-shirts pour hommes',
        parentCategory: createdCategories[0]._id,
        order: 1
      },
      {
        name: 'Pantalons Homme',
        description: 'Pantalons pour hommes',
        parentCategory: createdCategories[0]._id,
        order: 2
      },
      // Sous-catégories Femmes
      {
        name: 'Robes',
        description: 'Robes élégantes',
        parentCategory: createdCategories[1]._id,
        order: 1
      },
      {
        name: 'Tops Femme',
        description: 'Tops et hauts pour femmes',
        parentCategory: createdCategories[1]._id,
        order: 2
      }
    ];

    const createdSubCategories = [];
    for (const subCategoryData of subCategories) {
      const subCategory = new Category(subCategoryData);
      await subCategory.save();
      createdSubCategories.push(subCategory);
    }
    console.log('📁 Sous-catégories créées');

    // 5. Créer des produits
    const products = [
      // Produits Hommes
      {
        name: 'T-shirt Classique Blanc',
        description: 'T-shirt en coton 100% de qualité premium. Coupe classique, confortable pour un usage quotidien.',
        shortDescription: 'T-shirt blanc classique en coton',
        price: 29.99,
        originalPrice: 39.99,
        discount: 25,
        category: createdSubCategories[0]._id, // T-shirts Homme
        brand: 'Delta Fashion',
        sku: 'TS-WHT-001',
        images: ['https://via.placeholder.com/400x400/ffffff/000000?text=T-shirt+Blanc'],
        variants: [
          { size: 'S', color: 'Blanc', stock: 10, price: 29.99 },
          { size: 'M', color: 'Blanc', stock: 15, price: 29.99 },
          { size: 'L', color: 'Blanc', stock: 12, price: 29.99 },
          { size: 'XL', color: 'Blanc', stock: 8, price: 29.99 }
        ],
        colors: [{ name: 'Blanc', code: '#FFFFFF' }],
        sizes: ['S', 'M', 'L', 'XL'],
        isFeatured: true,
        isNew: true,
        isOnSale: true,
        tags: ['basique', 'coton', 'confort'],
        totalStock: 45
      },
      {
        name: 'Jean Slim Bleu',
        description: 'Jean slim fit en denim de qualité. Coupe moderne et ajustée, parfait pour un look décontracté chic.',
        shortDescription: 'Jean slim bleu délavé',
        price: 79.99,
        category: createdSubCategories[1]._id, // Pantalons Homme
        brand: 'Delta Fashion',
        sku: 'JN-BLU-001',
        images: ['https://via.placeholder.com/400x400/4169E1/ffffff?text=Jean+Bleu'],
        variants: [
          { size: 'S', color: 'Bleu', stock: 8, price: 79.99 },
          { size: 'M', color: 'Bleu', stock: 12, price: 79.99 },
          { size: 'L', color: 'Bleu', stock: 10, price: 79.99 },
          { size: 'XL', color: 'Bleu', stock: 6, price: 79.99 }
        ],
        colors: [{ name: 'Bleu', code: '#4169E1' }],
        sizes: ['S', 'M', 'L', 'XL'],
        isFeatured: true,
        isNew: false,
        tags: ['jean', 'denim', 'slim'],
        totalStock: 36
      },
      // Produits Femmes
      {
        name: 'Robe Élégante Noire',
        description: 'Robe noire élégante parfaite pour les occasions spéciales. Tissu fluide et coupe flatteuse.',
        shortDescription: 'Robe noire élégante',
        price: 89.99,
        originalPrice: 119.99,
        discount: 25,
        category: createdSubCategories[2]._id, // Robes
        brand: 'Delta Fashion',
        sku: 'RB-BLK-001',
        images: ['https://via.placeholder.com/400x400/000000/ffffff?text=Robe+Noire'],
        variants: [
          { size: 'XS', color: 'Noir', stock: 5, price: 89.99 },
          { size: 'S', color: 'Noir', stock: 8, price: 89.99 },
          { size: 'M', color: 'Noir', stock: 10, price: 89.99 },
          { size: 'L', color: 'Noir', stock: 7, price: 89.99 }
        ],
        colors: [{ name: 'Noir', code: '#000000' }],
        sizes: ['XS', 'S', 'M', 'L'],
        isFeatured: true,
        isNew: true,
        isOnSale: true,
        tags: ['robe', 'élégant', 'soirée'],
        totalStock: 30
      },
      {
        name: 'Top Fleuri Rose',
        description: 'Top léger avec motif floral. Parfait pour l\'été, tissu respirant et coupe féminine.',
        shortDescription: 'Top fleuri rose d\'été',
        price: 34.99,
        category: createdSubCategories[3]._id, // Tops Femme
        brand: 'Delta Fashion',
        sku: 'TP-FLR-001',
        images: ['https://via.placeholder.com/400x400/FFB6C1/ffffff?text=Top+Fleuri'],
        variants: [
          { size: 'XS', color: 'Rose', stock: 6, price: 34.99 },
          { size: 'S', color: 'Rose', stock: 9, price: 34.99 },
          { size: 'M', color: 'Rose', stock: 8, price: 34.99 },
          { size: 'L', color: 'Rose', stock: 5, price: 34.99 }
        ],
        colors: [{ name: 'Rose', code: '#FFB6C1' }],
        sizes: ['XS', 'S', 'M', 'L'],
        isFeatured: false,
        isNew: true,
        tags: ['top', 'fleuri', 'été'],
        totalStock: 28
      },
      // Produit Accessoire
      {
        name: 'Sac à Main Cuir Marron',
        description: 'Sac à main en cuir véritable de qualité premium. Design intemporel et fonctionnel.',
        shortDescription: 'Sac cuir marron premium',
        price: 149.99,
        category: createdCategories[3]._id, // Accessoires
        brand: 'Delta Fashion',
        sku: 'SAC-MAR-001',
        images: ['https://via.placeholder.com/400x400/8B4513/ffffff?text=Sac+Cuir'],
        variants: [
          { size: 'M', color: 'Marron', stock: 15, price: 149.99 }
        ],
        colors: [{ name: 'Marron', code: '#8B4513' }],
        sizes: ['M'],
        isFeatured: true,
        isNew: false,
        tags: ['sac', 'cuir', 'accessoire'],
        totalStock: 15
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
    }
    console.log('🛍️ Produits créés');

    console.log('\n🎉 Base de données peuplée avec succès !');
    console.log('\n📋 Résumé :');
    console.log(`👤 Utilisateurs créés: ${await User.countDocuments()}`);
    console.log(`📂 Catégories créées: ${await Category.countDocuments()}`);
    console.log(`🛍️ Produits créés: ${await Product.countDocuments()}`);
    
    console.log('\n🔑 Comptes de test :');
    console.log('Admin: admin@deltafashion.com / admin123');
    console.log('User: ahmedchetoui987@gmail.com / test123');

  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
  } finally {
    // Ne pas déconnecter MongoDB si appelé depuis l'API
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('🔌 Déconnecté de MongoDB');
      process.exit(0);
    }
  }
};

// Exporter la fonction pour pouvoir l'utiliser dans d'autres fichiers
module.exports = seedData;

// Exécuter le script seulement si ce fichier est appelé directement
if (require.main === module) {
  seedData();
}
