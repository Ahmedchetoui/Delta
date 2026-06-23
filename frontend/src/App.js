import React, { useEffect, useState, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './components/layout/LandingPage';
import ScrollToTop from './components/ui/ScrollToTop';
import { bootstrapApp } from './utils/bootstrapApp';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { getCurrentUser } from './store/slices/authSlice';

// Lazy Loading Pages
const Home = React.lazy(() => import('./pages/Home'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Product = React.lazy(() => import('./pages/Product'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Orders = React.lazy(() => import('./pages/Orders'));
const OrderTracking = React.lazy(() => import('./pages/OrderTracking'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Delivery = React.lazy(() => import('./pages/Delivery'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation'));
const GuestOrderTracking = React.lazy(() => import('./pages/GuestOrderTracking'));
const RequestAdmin = React.lazy(() => import('./pages/RequestAdmin'));

// Admin Lazy Loading
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductNew = React.lazy(() => import('./pages/admin/AdminProductNew'));
const AdminProductEdit = React.lazy(() => import('./pages/admin/AdminProductEdit'));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories'));
const AdminBanners = React.lazy(() => import('./pages/admin/AdminBanners'));
const AdminCustomers = React.lazy(() => import('./pages/admin/AdminCustomers'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminFiabilo = React.lazy(() => import('./pages/admin/AdminFiabilo'));
const AdminRequests = React.lazy(() => import('./pages/admin/AdminRequests'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));

// Loading Component
const PageLoader = () => (
  <div className="flex justify-center items-center py-20 min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const [showLanding, setShowLanding] = useState(() => {
    return !(
      localStorage.getItem('hasSeenLanding') ||
      sessionStorage.getItem('hasSeenLanding')
    );
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const runBootstrap = async () => {
      try {
        await bootstrapApp(dispatch);
      } finally {
        if (!cancelled) {
          setAppReady(true);
        }
      }
    };

    runBootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const handleLandingComplete = () => {
    localStorage.setItem('hasSeenLanding', 'true');
    sessionStorage.setItem('hasSeenLanding', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onComplete={handleLandingComplete} isReady={appReady} />;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ScrollToTop />

      <main className="min-h-screen pt-14 md:pt-16">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/guest-order-tracking" element={<GuestOrderTracking />} />
            <Route path="/boutique" element={<Navigate to="/shop" replace />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/request-admin" element={
              <ProtectedRoute>
                <RequestAdmin />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            } />
            <Route path="/admin/products/new" element={
              <AdminRoute>
                <AdminProductNew />
              </AdminRoute>
            } />
            <Route path="/admin/products/edit/:id" element={
              <AdminRoute>
                <AdminProductEdit />
              </AdminRoute>
            } />
            <Route path="/admin/categories" element={
              <AdminRoute>
                <AdminCategories />
              </AdminRoute>
            } />
            <Route path="/admin/banners" element={
              <AdminRoute>
                <AdminBanners />
              </AdminRoute>
            } />
            <Route path="/admin/customers" element={
              <AdminRoute>
                <AdminCustomers />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            } />
            <Route path="/admin/fiabilo" element={
              <AdminRoute>
                <AdminFiabilo />
              </AdminRoute>
            } />
            <Route path="/admin/requests" element={
              <AdminRoute>
                <AdminRequests />
              </AdminRoute>
            } />
            <Route path="/admin/analytics" element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            } />

            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Page non trouvée</p>
                  <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Retour à l'accueil
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;
