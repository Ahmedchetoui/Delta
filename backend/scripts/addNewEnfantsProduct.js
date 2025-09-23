const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';

async function addNewEnfantsProduct() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1) Vérifier que la catégorie "Enfants" existe
    const enfantsCategory = await Category.findOne({ name: 'Enfants' });
    if (!enfantsCategory) {
      console.log('❌ Catégorie "Enfants" non trouvée. Création de la catégorie...');
      
      const newCategory = new Category({
        name: 'Enfants',
        description: 'Mode pour enfants - Vêtements confortables et stylés',
        image: 'categorie/enfants.jpg',
        icon: 'child',
        order: 3,
        isActive: true,
      });
      await newCategory.save();
      console.log('📂 Catégorie "Enfants" créée avec succès');
      
      // Utiliser la nouvelle catégorie
      var categoryId = newCategory._id;
    } else {
      console.log('📂 Catégorie "Enfants" trouvée');
      var categoryId = enfantsCategory._id;
    }

    // 2) Vérifier les produits existants dans la catégorie Enfants
    const existingProducts = await Product.find({ category: categoryId });
    console.log(`📊 Produits existants dans la catégorie Enfants: ${existingProducts.length}`);
    
    // Générer un nom unique
    const timestamp = Date.now();
    const productName = `Ensemble Enfant Premium ${timestamp}`;
    
    // 3) Créer un nouveau produit enfants avec les 5 images
    const newProduct = new Product({
      name: productName,
      description: 'Ensemble complet pour enfants comprenant un haut et un bas assortis. Fabriqué avec des matériaux de qualité, doux et confortables pour la peau délicate des enfants. Parfait pour toutes les occasions, du quotidien aux sorties spéciales. Design moderne et couleurs attrayantes qui plairont aux enfants et aux parents.',
      shortDescription: 'Ensemble enfant confortable et stylé',
      price: 45.99,
      originalPrice: 59.99,
      discount: 23,
      category: categoryId,
      brand: 'Delta Fashion Kids',
      // Utiliser les 5 images du dossier produit
      images: [
        'produit/img1.jpg',
        'produit/img2.jpg', 
        'produit/img3.jpg',
        'produit/img4.jpg',
        'produit/img5.jpg'
      ],
      variants: [
        { size: 'S', color: 'Bleu', stock: 15, price: 45.99 },
        { size: 'M', color: 'Bleu', stock: 20, price: 45.99 },
        { size: 'L', color: 'Bleu', stock: 12, price: 45.99 },
        { size: 'S', color: 'Rose', stock: 10, price: 45.99 },
        { size: 'M', color: 'Rose', stock: 18, price: 45.99 },
        { size: 'L', color: 'Rose', stock: 8, price: 45.99 }
      ],
      colors: [
        { name: 'Bleu', code: '#4A90E2' },
        { name: 'Rose', code: '#FF69B4' }
      ],
      sizes: ['S', 'M', 'L'],
      isFeatured: true,
      isNewProduct: true,
      isOnSale: true,
      tags: ['enfant', 'ensemble', 'confortable', 'tendance', 'qualité'],
      weight: 0.3,
      dimensions: {
        length: 25,
        width: 20,
        height: 2
      },
      shipping: {
        freeShipping: true
      },
      metaTitle: 'Ensemble Enfant Tendance - Delta Fashion',
      metaDescription: 'Découvrez notre ensemble enfant confortable et stylé. Qualité premium, design moderne. Livraison gratuite.'
    });

    // Calculer le stock total à partir des variantes
    newProduct.totalStock = newProduct.variants.reduce((total, variant) => total + variant.stock, 0);

    await newProduct.save();
    console.log('🛍️ Nouveau produit enfants créé avec succès !');
    console.log(`📊 Produit ID: ${newProduct._id}`);
    console.log(`📦 Stock total: ${newProduct.totalStock}`);
    console.log(`💰 Prix: ${newProduct.price}€ (prix original: ${newProduct.originalPrice}€)`);
    console.log(`🖼️ Images: ${newProduct.images.length} images ajoutées`);

    console.log('\n🎉 Produit ajouté avec succès !');
    console.log('Les images utilisées sont:');
    newProduct.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img}`);
    });

  } catch (err) {
    console.error('❌ Erreur lors de l\'ajout du produit:', err);
    if (err.code === 11000) {
      console.error('💡 Erreur de duplication - un produit avec ce nom ou SKU existe déjà');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

if (require.main === module) {
  addNewEnfantsProduct();
}

module.exports = addNewEnfantsProduct;
