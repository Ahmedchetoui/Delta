import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import Skeleton from '../components/ui/Skeleton';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import {
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

const Shop = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);

  const {
    products,
    isLoading: loading,
    isRefreshing,
    pagination: {
      totalProducts = 0,
      currentPage = 1,
      totalPages = 1
    } = {}
  } = useSelector((state) => state.products);
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useSelector(
    (state) => state.categories
  );

  useEffect(() => {
    if (categories.length > 0 || categoriesLoading) return;
    dispatch(fetchCategories());
  }, [dispatch, categories.length, categoriesLoading, categoriesError]);

  // Récupérer les paramètres de l'URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const color = searchParams.get('color') || '';
  const size = searchParams.get('size') || '';
  const onSale = searchParams.get('onSale') === 'true';
  const featured = searchParams.get('featured') === 'true';
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    document.title = search
      ? `${t('searchResultsFor')}: "${search}" - Delta Fashion`
      : `${t('shopTitle')} - Delta Fashion`;
    return () => { document.title = 'Delta Fashion - Votre style, notre passion'; };
  }, [search, t]);

  useEffect(() => {
    if (!searchParams.get('brand')) return;
    const params = new URLSearchParams(searchParams);
    params.delete('brand');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const filters = {
      search,
      category,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      color,
      size,
      onSale,
      featured,
      page,
      limit: 12,
      sort: sortBy
    };

    dispatch(fetchProducts(filters));
  }, [dispatch, search, category, minPrice, maxPrice, color, size, onSale, featured, page, sortBy, catalogVersion]);

  useEffect(() => {
    const refreshProducts = () => setCatalogVersion((version) => version + 1);
    window.addEventListener('delta:catalog-updated', refreshProducts);
    return () => window.removeEventListener('delta:catalog-updated', refreshProducts);
  }, []);

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setShowSortMenu(false);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortOptions = [
    { value: 'newest', label: t('newest') },
    { value: 'oldest', label: t('oldest') },
    { value: 'price_asc', label: t('priceAsc') },
    { value: 'price_desc', label: t('priceDesc') },
    { value: 'name_asc', label: t('nameAsc') },
    { value: 'name_desc', label: t('nameDesc') },
    { value: 'rating', label: t('rating') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {search ? `${t('searchResultsFor')} "${search}"` : t('shopTitle')}
          </h1>
          <div className="text-gray-600">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${totalProducts || 0} ${(totalProducts || 0) > 1 ? t('productsFound') : t('productFound')}`
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('filters')}</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <ProductFilters
                categories={categories}
                onFilterChange={handleFilterChange}
                currentFilters={{
                  category,
                  minPrice,
                  maxPrice,
                  color,
                  size,
                  onSale,
                  featured
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>{t('filters')}</span>
                </button>

                {/* View Mode & Sort */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 rtl:space-x-reverse">
                  {/* View Mode */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Squares2X2Icon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <ListBulletIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                    >
                      <span>{t('sortBy')}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>

                    {showSortMenu && (
                      <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`block w-full text-left rtl:text-right px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === option.value ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            <div className={isRefreshing ? 'opacity-90 transition-opacity duration-300' : ''}>
            {loading && products.length === 0 ? (
              <div className={`grid gap-6 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
                }`}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-md p-4 h-96">
                    <Skeleton className="w-full h-64 rounded-xl mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-6 ${viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
                  }`}>
                  {products.map((product, index) => (
                    <ProductCard key={product._id} product={product} viewMode={viewMode} priority={index < 4} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('previous')}
                      </button>

                      {[...Array(totalPages)].map((_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-2 border rounded-md text-sm font-medium ${currentPage === pageNumber
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('next')}
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 text-lg mb-4">{t('noProductsFound')}</p>
                <p className="text-gray-400 text-sm">
                  {t('modifyFiltersText')}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
