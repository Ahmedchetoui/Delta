import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFeaturedProducts, fetchNewProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import Loading from '../components/ui/Loading';
import ProductCard from '../components/product/ProductCard';
import HeroSlider from '../components/ui/HeroSlider';
import api from '../services/api';

const Home = () => {
  const dispatch = useDispatch();
  const { featuredProducts = [], newProducts = [], loading: productsLoading } = useSelector((state) => state.products || {});
  const { categories = [], loading: categoriesLoading } = useSelector((state) => state.categories || {});
  const [banners, setBanners] = useState([]);

  // Bannière par défaut si l'API échoue
  const defaultBanners = React.useMemo(() => [
    {
      _id: 'default-1',
      title: "Nouvelle Collection Automne 2026",
      subtitle: "Découvrez notre sélection de vêtements tendance et élégants pour toute la famille",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      buttonLink: "/shop",
      buttonText: "Découvrir",
      backgroundColor: "#f8f9fa",
      textColor: "#ffffff",
      position: "center"
    }
  ], []);

  const loadBanners = React.useCallback(async () => {
    try {
      const response = await api.get('/banners');
      setBanners(response.data.banners);
    } catch (error) {
      console.error('Erreur lors du chargement des bannières:', error);
      setBanners(defaultBanners);
    }
  }, [defaultBanners]);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
    loadBanners();
  }, [dispatch, loadBanners]);

  useEffect(() => {
    if (featuredProducts.length === 0) {
      dispatch(fetchNewProducts());
    }
  }, [dispatch, featuredProducts.length]);

  const heroSlides = banners.map(banner => ({
    id: banner._id,
    title: banner.title,
    subtitle: banner.subtitle,
    description: banner.description,
    image: banner.image,
    link: banner.buttonLink,
    buttonText: banner.buttonText,
    backgroundColor: banner.backgroundColor,
    textColor: banner.textColor,
    position: banner.position
  }));

  if (productsLoading || categoriesLoading) {
    return <Loading size="large" text="Chargement de la page d'accueil..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroSlider slides={heroSlides} />

      {/* Categories */}
      <section id="categories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 heading-premium">
              Nos Catégories
            </h2>
            <p className="text-lg text-gray-600">Explorez notre collection</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {categories.slice(0, 4).map((category) => (
              <Link key={category._id} to={`/shop?category=${category._id}`} className="group">
                <div className="relative h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  <img
                    src={category.image || 'https://via.placeholder.com/600x800'}
                    alt={category.name}
                    loading="lazy"
                    width="600"
                    height="800"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-white text-2xl font-bold capitalize mb-2">{category.name}</h3>
                    <span className="text-blue-400 font-medium">Découvrir →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 heading-premium">
              Produits Vedettes
            </h2>
            <p className="text-lg text-gray-600">Découvrez nos produits populaires</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(featuredProducts.length > 0 ? featuredProducts : newProducts).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/shop" className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl">
              Voir tous les produits →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">🚚</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Livraison Rapide</h3>
              <p className="text-gray-600">Livraison gratuite dès 100 DT</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">💳</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Paiement Sécurisé</h3>
              <p className="text-gray-600">Paiement en ligne ou à la livraison</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">🔄</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Retours Faciles</h3>
              <p className="text-gray-600">Retour gratuit sous 14 jours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-10"></div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Restez Informé</h2>
          <p className="text-xl text-blue-100 mb-10">Recevez nos dernières offres et nouveautés</p>

          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-6 py-4 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <button className="bg-white text-blue-900 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg">
              S'abonner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
