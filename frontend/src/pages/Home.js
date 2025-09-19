import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFeaturedProducts, fetchNewProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import Loading from '../components/ui/Loading';
import ProductCard from '../components/product/ProductCard';
import HeroSlider from '../components/ui/HeroSlider';

const Home = () => {
  const dispatch = useDispatch();
  const { featuredProducts = [], newProducts = [], loading: productsLoading } = useSelector((state) => state.products || {});
  const { categories = [], loading: categoriesLoading } = useSelector((state) => state.categories || {});

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fallback: si aucune vedette, charger les nouveaux produits
  useEffect(() => {
    if (featuredProducts.length === 0) {
      dispatch(fetchNewProducts());
    }
  }, [dispatch, featuredProducts.length]);

  const heroSlides = [
    {
      id: 1,
      title: "Nouvelle Collection Automne 2024",
      subtitle: "Découvrez les dernières tendances de la mode",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      link: "/shop",
      buttonText: "Découvrir"
    },
    {
      id: 2,
      title: "Soldes d'Été",
      subtitle: "Jusqu'à -50% sur une sélection d'articles",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      link: "/shop?onSale=true",
      buttonText: "Voir les offres"
    },
    {
      id: 3,
      title: "Livraison Gratuite",
      subtitle: "Sur toutes vos commandes dès 100 DT",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      link: "/delivery",
      buttonText: "En savoir plus"
    }
  ];

  if (productsLoading || categoriesLoading) {
    return <Loading size="large" text="Chargement de la page d'accueil..." />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider slides={heroSlides} />

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Catégories
            </h2>
            <p className="text-lg text-gray-600">
              Explorez notre large gamme de produits
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category._id}`}
                className="group"
              >
                <div className="relative h-64 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={category.image || 'https://via.placeholder.com/600x800?text=Catégorie'}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-white text-xl font-bold capitalize drop-shadow">{category.name}</h3>
                    <span className="text-white/80 text-sm">Catégorie</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Produits Vedettes
            </h2>
            <p className="text-lg text-gray-600">
              Découvrez nos produits les plus populaires
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(featuredProducts.length > 0 ? featuredProducts : newProducts).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Voir tous les produits
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Livraison Rapide
              </h3>
              <p className="text-gray-600">
                Livraison gratuite dès 100 DT dans toute la Tunisie
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Paiement Sécurisé
              </h3>
              <p className="text-gray-600">
                Paiement en ligne sécurisé ou à la livraison
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Retours Faciles
              </h3>
              <p className="text-gray-600">
                Retour gratuit sous 14 jours si vous n'êtes pas satisfait
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Restez Informé
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Recevez nos dernières offres et nouveautés directement dans votre boîte mail
          </p>
          
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-3 rounded-l-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-r-lg font-semibold hover:bg-gray-100 transition-colors">
              S'abonner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
