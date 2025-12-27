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

const Shop = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { products, loading, totalProducts, currentPage, totalPages } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  // Récupérer les paramètres de l'URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const brand = searchParams.get('brand') || '';
  const color = searchParams.get('color') || '';
  const size = searchParams.get('size') || '';
  const onSale = searchParams.get('onSale') === 'true';
  const featured = searchParams.get('featured') === 'true';
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    const filters = {
      search,
      category,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      brand,
      color,
      size,
      onSale,
      featured,
      page,
      limit: 12,
      sort: sortBy
    };

    dispatch(fetchProducts(filters));
  }, [dispatch, search, category, minPrice, maxPrice, brand, color, size, onSale, featured, page, sortBy]);

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams(searchParams);

    // Réinitialiser la page à 1 lors d'un changement de filtre
    params.set('page', '1');

    // Mettre à jour les paramètres
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
    { value: 'newest', label: 'Plus récents' },
    { value: 'oldest', label: 'Plus anciens' },
    { value: 'price-low', label: 'Prix croissant' },
    { value: 'price-high', label: 'Prix décroissant' },
    { value: 'name-asc', label: 'Nom A-Z' },
    { value: 'name-desc', label: 'Nom Z-A' },
    { value: 'rating', label: 'Mieux notés' }
  ];

  // No longer blocking the whole page with a loader
  // if (loading && products.length === 0) {
  //   return <Loading size="large" text="Chargement des produits..." />;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {search ? `Résultats pour "${search}"` : 'Boutique'}
          </h1>
          <p className="text-gray-600">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${totalProducts || 0} produit${(totalProducts || 0) > 1 ? 's' : ''} trouvé${(totalProducts || 0) > 1 ? 's' : ''}`
            )}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
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
                  brand,
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
                  className="lg:hidden flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filtres</span>
                </button>

                {/* View Mode & Sort */}
                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  {/* View Mode */}
                  <div className="flex items-center space-x-2">
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
                      className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                    >
                      <span>Trier par</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>

                    {showSortMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === option.value ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
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
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} viewMode={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>

                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        const isCurrentPage = page === currentPage;
                        const isNearCurrentPage = Math.abs(page - currentPage) <= 2;
                        const isFirstPage = page === 1;
                        const isLastPage = page === totalPages;

                        if (isFirstPage || isLastPage || isNearCurrentPage) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${isCurrentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === 2 && currentPage > 4) {
                          return <span key={page} className="px-3 py-2 text-gray-500">...</span>;
                        } else if (page === totalPages - 1 && currentPage < totalPages - 3) {
                          return <span key={page} className="px-3 py-2 text-gray-500">...</span>;
                        }
                        return null;
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche ou de filtrage.
                </p>
                <button
                  onClick={() => setSearchParams({})}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Voir tous les produits
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
