import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { scrollToTop } from '../../utils/scrollUtils';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // Handle navigation with centered scrolling
  const handleNavClick = (e, path, sectionId = null) => {
    e.preventDefault();
    setIsMenuOpen(false); // Close mobile menu

    if (path === '/') {
      if (location.pathname === '/') {
        // Already on home page, scroll to top
        scrollToTop();
      } else {
        // Navigate to home page
        navigate('/');
      }
    } else {
      // Navigate to other pages
      navigate(path);
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gold/10">
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <a href="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center space-x-4 cursor-pointer">
            <img
              src={require('../../assets/logo/delta.jpg')}
              alt="Delta Fashion"
              className="h-12 w-12 md:h-16 md:w-16 rounded object-cover"
              loading="eager"
            />
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Delta Fashion</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" onClick={(e) => handleNavClick(e, '/')} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer font-medium">
              Accueil
            </a>
            <a href="/shop" onClick={(e) => handleNavClick(e, '/shop')} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer font-medium">
              Boutique
            </a>
            <a href="/about" onClick={(e) => handleNavClick(e, '/about')} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer font-medium">
              À propos
            </a>
            <a href="/contact" onClick={(e) => handleNavClick(e, '/contact')} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer font-medium">
              Contact
            </a>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Search Icon (Mobile) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="hidden md:block relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600">
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden sm:block">{user?.firstName}</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mon Profil
                  </Link>
                  {user?.role !== 'admin' && (
                    <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Mes Commandes
                    </Link>
                  )}
                  {user?.role !== 'admin' && (
                    <Link to="/request-admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Demander Admin
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Administration
                      </Link>
                      <Link to="/admin/banners" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Gérer les bannières
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Connexion
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <a href="/" onClick={(e) => handleNavClick(e, '/')} className="text-gray-700 hover:text-blue-600 cursor-pointer">
                Accueil
              </a>
              <a href="/shop" onClick={(e) => handleNavClick(e, '/shop')} className="text-gray-700 hover:text-blue-600 cursor-pointer">
                Boutique
              </a>
              <a href="/about" onClick={(e) => handleNavClick(e, '/about')} className="text-gray-700 hover:text-blue-600 cursor-pointer">
                À propos
              </a>
              <a href="/contact" onClick={(e) => handleNavClick(e, '/contact')} className="text-gray-700 hover:text-blue-600 cursor-pointer">
                Contact
              </a>
              {!isAuthenticated && (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-blue-600">
                    Connexion
                  </Link>
                  <Link to="/register" className="text-blue-600 hover:text-blue-700">
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
