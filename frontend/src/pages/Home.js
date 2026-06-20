import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Skeleton from '../components/ui/Skeleton';
import ProductCard from '../components/product/ProductCard';
import HeroSlider from '../components/ui/HeroSlider';
import { resolveImageUrl } from '../utils/imageUtils';
import { useEnsureHomeData } from '../hooks/useEnsureHomeData';
import { fetchHomeData, clearHomeError } from '../store/slices/homeSlice';

const Home = () => {
  const dispatch = useDispatch();
  useEnsureHomeData();

  const { featuredProducts = [], newProducts = [], isLoading: productsLoading } = useSelector(
    (state) => state.products || {}
  );
  const { categories = [], isLoading: categoriesLoading } = useSelector(
    (state) => state.categories || {}
  );
  const { banners = [], isLoading: homeLoading, error: homeError } = useSelector(
    (state) => state.home || {}
  );

  const displayProducts = featuredProducts.length > 0 ? featuredProducts : newProducts;
  const isBootstrapping = homeLoading || categoriesLoading || productsLoading;
  const showCategorySkeleton = isBootstrapping && categories.length === 0;
  const showProductSkeleton = isBootstrapping && displayProducts.length === 0;
  const showLoadError = !isBootstrapping && homeError && categories.length === 0 && displayProducts.length === 0;

  const handleRetry = () => {
    dispatch(clearHomeError());
    dispatch(fetchHomeData());
  };

  const heroSlides = useMemo(() => {
    return banners.map((banner) => ({
      id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      image: resolveImageUrl(banner.image),
      link: banner.buttonLink,
      buttonText: banner.buttonText,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      position: banner.position,
    }));
  }, [banners]);

  const showHeroSkeleton = homeLoading && banners.length === 0;

  return (
    <div className="min-h-screen bg-white -mt-14 md:-mt-16">
      {showHeroSkeleton ? (
        <div className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-gray-200 animate-pulse" />
      ) : (
        heroSlides.length > 0 && <HeroSlider slides={heroSlides} />
      )}

      {showLoadError && (
        <div className="max-w-lg mx-auto my-8 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <p className="text-amber-900 mb-4">
            Connexion lente au serveur. Les catégories et produits n&apos;ont pas pu charger.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

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
            {showCategorySkeleton ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="relative h-72 rounded-2xl overflow-hidden shadow-lg">
                  <Skeleton className="w-full h-full" />
                </div>
              ))
            ) : (
              categories
                .filter((c) => !c.parentCategory)
                .slice(0, 4)
                .map((category) => (
                  <Link key={category._id} to={`/shop?category=${category._id}`} className="group">
                    <div className="relative h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                      <img
                        key={`${category._id}-${category.updatedAt || ''}`}
                        src={resolveImageUrl(category.image, 800, category.updatedAt)}
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
                ))
            )}
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
            {showProductSkeleton ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              displayProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} priority={index < 2} />
              ))
            )}
          </div>

          <div className="text-center mt-16">
            <Link
              to="/shop"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Voir tous les produits →
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-10" />
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
