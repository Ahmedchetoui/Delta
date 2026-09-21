import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Skeleton from '../components/ui/Skeleton';
import ProductCard from '../components/product/ProductCard';
import HeroSlider from '../components/ui/HeroSlider';
import { getResponsiveImageSrcSet, resolveImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageUtils';
import { useEnsureHomeData } from '../hooks/useEnsureHomeData';
import { fetchHomeData, clearHomeError } from '../store/slices/homeSlice';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const dispatch = useDispatch();
  const { t, isRTL } = useLanguage();
  useEnsureHomeData();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    document.title = 'Delta Fashion - ' + t('heroTitle');
  }, [t]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.error('Veuillez saisir une adresse email valide');
      return;
    }
    toast.success('Merci ! Vous serez informé de nos offres et nouveautés 🎉');
    setNewsletterEmail('');
  };

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
    return banners
      .filter((banner) => Boolean(banner.image))
      .map((banner) => ({
      id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      image: resolveImageUrl(banner.image, 1600),
      imageSrcSet: getResponsiveImageSrcSet(banner.image, [768, 1200, 1600, 1920]),
      mobileImage: banner.mobileImage ? resolveImageUrl(banner.mobileImage, 800) : null,
      mobileImageSrcSet: banner.mobileImage ? getResponsiveImageSrcSet(banner.mobileImage, [360, 480, 768, 1080]) : null,
      link: banner.buttonLink,
      buttonText: banner.buttonText,
      showCollectionBadge: banner.showCollectionBadge,
      collectionBadgeText: banner.collectionBadgeText,
      showBrandTitle: banner.showBrandTitle,
      brandTitle: banner.brandTitle,
      showButton: banner.showButton,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      position: banner.position,
    }));
  }, [banners]);

  const showHeroSkeleton = homeLoading && banners.length === 0;

  const activeCategories = categories.filter((c) => !c.parentCategory);

  return (
    <div className="min-h-screen bg-white -mt-14 md:-mt-16">
      {/* Hero Banner plein écran bord à bord (edge-to-edge sans espace vide) */}
      {showHeroSkeleton ? (
        <section className="relative w-full h-[560px] sm:h-[640px] md:h-[720px] lg:h-[800px] overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-slate-900 text-white">
          <div className="relative flex h-full items-center justify-center px-4 text-center pt-14 md:pt-16">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-200">{t('heroTag')}</p>
              <h1 className="mb-6 text-5xl font-bold md:text-6xl">{t('heroTitle')}</h1>
              <Link
                to="/shop"
                className="inline-block rounded-xl bg-white px-8 py-4 font-semibold text-blue-900 shadow-lg transition-colors hover:bg-blue-50"
              >
                {t('discoverShop')}
              </Link>
            </div>
          </div>
        </section>
      ) : heroSlides.length > 0 ? (
        <HeroSlider slides={heroSlides} />
      ) : (
        <section className="relative w-full h-[560px] sm:h-[640px] md:h-[720px] lg:h-[800px] overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-slate-900 text-white">
          <div className="relative flex h-full items-center justify-center px-4 text-center pt-14 md:pt-16">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-200">{t('heroTag')}</p>
              <h1 className="mb-6 text-5xl font-bold md:text-6xl">{t('heroTitle')}</h1>
              <Link
                to="/shop"
                className="inline-block rounded-xl bg-white px-8 py-4 font-semibold text-blue-900 shadow-lg transition-colors hover:bg-blue-50"
              >
                {t('discoverShop')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {showLoadError && (
        <div className="max-w-lg mx-auto my-8 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <p className="text-amber-900 mb-4">
            {t('slowServerConnection')}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Categories */}
      <section id="categories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 heading-premium">
              {t('ourCategories')}
            </h2>
            <p className="text-lg text-gray-600">{t('exploreCollection')}</p>
          </div>

          <div
            className={`grid gap-8 ${
              activeCategories.length === 1
                ? 'grid-cols-1 max-w-sm sm:max-w-md mx-auto justify-center'
                : activeCategories.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto justify-center'
                : activeCategories.length === 3
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {showCategorySkeleton ? (
              [...Array(activeCategories.length || 2)].map((_, i) => (
                <div key={i} className="relative h-[420px] sm:h-[460px] md:h-[480px] lg:h-[500px] rounded-3xl overflow-hidden shadow-lg">
                  <Skeleton className="w-full h-full" />
                </div>
              ))
            ) : (
              activeCategories.map((category) => (
                <Link key={category._id} to={`/shop?category=${category._id}`} className="group block">
                  <div className="relative h-[420px] sm:h-[460px] md:h-[480px] lg:h-[500px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
                    <img
                      key={`${category._id}-${category.updatedAt || ''}`}
                      src={resolveImageUrl(category.image, 640, category.updatedAt)}
                      srcSet={getResponsiveImageSrcSet(category.image, [360, 480, 640, 800], category.updatedAt)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      alt={category.name}
                      loading="lazy"
                      width="600"
                      height="800"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                        e.currentTarget.srcset = '';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 rtl:left-auto rtl:right-8">
                      <h3 className="text-white text-2xl md:text-3xl font-bold capitalize mb-2 drop-shadow-md">
                        {category.name}
                      </h3>
                      <span className="inline-flex items-center gap-2 text-blue-400 font-semibold text-sm md:text-base group-hover:text-blue-300 transition-colors">
                        {t('discover')}
                        <ArrowRightIcon className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                      </span>
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
              {t('featuredProducts')}
            </h2>
            <p className="text-lg text-gray-600">{t('discoverPopular')}</p>
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
              {t('seeAllProducts')} {isRTL ? '←' : '→'}
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-10" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{t('stayInformed')}</h2>
          <p className="text-xl text-blue-100 mb-10">{t('newsletterSubtitle')}</p>

          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 px-2 sm:px-0">
            <input
              type="email"
              placeholder={t('yourEmail')}
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 w-full px-6 py-4 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 text-base"
            />
            <button type="submit" className="w-full sm:w-auto shrink-0 bg-white text-blue-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg text-base whitespace-nowrap">
              {t('subscribe')}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
