import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import categoryReducer from './slices/categorySlice';
import homeReducer from './slices/homeSlice';
import orderReducer from './slices/orderSlice';
import uiReducer from './slices/uiSlice';
import adminRequestReducer from './slices/adminRequestSlice';
import { readHomeCache } from '../utils/homeCache';

function getPreloadedHomeState() {
  const cachedHomeData = readHomeCache();
  if (!cachedHomeData) return undefined;

  const products = productReducer(undefined, { type: '@@INIT' });
  const allHomeProducts = [
    ...cachedHomeData.featuredProducts,
    ...cachedHomeData.newProducts,
  ];
  const productCache = allHomeProducts.reduce((cache, product) => {
    cache[product._id] = { product, loadedAt: Date.now() };
    return cache;
  }, {});

  return {
    home: {
      ...homeReducer(undefined, { type: '@@INIT' }),
      banners: cachedHomeData.banners,
      loadedAt: Date.now(),
    },
    categories: {
      ...categoryReducer(undefined, { type: '@@INIT' }),
      categories: cachedHomeData.categories,
    },
    products: {
      ...products,
      featuredProducts: cachedHomeData.featuredProducts,
      newProducts: cachedHomeData.newProducts,
      productCache,
    },
  };
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    categories: categoryReducer,
    home: homeReducer,
    orders: orderReducer,
    ui: uiReducer,
    adminRequests: adminRequestReducer,
  },
  preloadedState: getPreloadedHomeState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});
