import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShoppingBagIcon as ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { logout } from '../../store/slices/authSlice';

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

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  // Si on change de page, fermer le menu
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

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

  const handleNavClick = (e, path) => {
    if (path === '/' && location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  // Styles constants
  const linkClasses = "text-gray-700 hover:text-blue-600 transition-colors cursor-pointer font-medium";
  const iconClasses = "text-gray-700 hover:text-blue-600 transition-colors cursor-pointer";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-lg border-b border-gray-100 transition-all duration-300">
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center space-x-4 cursor-pointer">
            <img
              src={require('../../assets/logo/delta.jpg')}
              alt="Delta Fashion"
              className="h-12 w-12 md:h-16 md:w-16 rounded object-cover"
              loading="eager"
            />
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent" style={{ fontFamily: "'Playfair Display', serif" }}>
              Delta Fashion
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" onClick={(e) => handleNavClick(e, '/')} className={linkClasses}>
              Accueil
            </Link>
            <Link to="/shop" className={linkClasses}>
              Boutique
            </Link>
            <Link to="/about" className={linkClasses}>
              À propos
            </Link>
            <Link to="/contact" className={linkClasses}>
              Contact
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
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
              className={`md:hidden p-2 ${iconClasses}`}
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            {/* Cart */}
            <Link to="/cart" className={`relative p-2 ${iconClasses}`}>
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
                <button className={`flex items-center space-x-2 p-2 ${iconClasses}`}>
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
                <Link to="/login" className={linkClasses}>
                  Connexion
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 ${iconClasses}`}
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
          <div className="md:hidden py-4 border-t border-gray-100 animate-fadeIn">
            <form onSubmit={handleSearch} className="px-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  autoFocus
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu (Professional Gray & Centered) */}
        {isMenuOpen && (
          <div className="md:hidden fixed top-[64px] inset-x-0 bg-gray-100/95 backdrop-blur-md shadow-xl border-t border-gray-200 animate-slideDown z-40 transition-all duration-300 ease-in-out">
            <div className="flex flex-col space-y-4 py-8 px-4 text-center">
              <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="text-gray-800 hover:text-blue-600 font-bold text-xl py-3 border-b border-gray-200/50 w-3/4 mx-auto">
                Accueil
              </Link>
              <Link to="/shop" className="text-gray-800 hover:text-blue-600 font-bold text-xl py-3 border-b border-gray-200/50 w-3/4 mx-auto">
                Boutique
              </Link>
              <Link to="/about" className="text-gray-800 hover:text-blue-600 font-bold text-xl py-3 border-b border-gray-200/50 w-3/4 mx-auto">
                À propos
              </Link>
              <Link to="/contact" className="text-gray-800 hover:text-blue-600 font-bold text-xl py-3 w-3/4 mx-auto">
                Contact
              </Link>

              <div className="pt-6 flex flex-col items-center gap-4">
                {!isAuthenticated && (
                  <>
                    <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium text-lg">
                      Connexion
                    </Link>
                    <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-md text-lg font-medium">
                      S'inscrire
                    </Link>
                  </>
                )}
                {isAuthenticated && (
                  <>
                    <Link to="/profile" className="text-gray-700 hover:text-blue-600 font-medium text-lg">
                      Mon Profil
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="text-blue-600 font-bold text-lg">
                        Espace Admin
                      </Link>
                    )}
                    <button onClick={handleLogout} className="text-red-500 font-medium mt-2 text-lg">
                      Déconnexion
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
