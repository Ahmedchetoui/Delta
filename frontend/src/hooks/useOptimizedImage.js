import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour le chargement optimisé des images
 * Gère:
 * - Lazy loading
 * - Progressive image loading
 * - Placeholder avec skeleton
 * - Retry en cas d'erreur
 */
export const useOptimizedImage = (imageUrl, options = {}) => {
  const {
    sizes = ['thumbnail', 'small', 'medium', 'large'],
    defaultSize = 'medium',
    fallback = '/api/placeholder/300/300',
    retryCount = 3,
  } = options;

  const [imageState, setImageState] = useState({
    loaded: false,
    error: false,
    retries: 0,
    currentUrl: null,
  });

  /**
   * Génère une URL optimisée avec taille
   */
  const getOptimizedUrl = useCallback((url, size = defaultSize) => {
    if (!url) return fallback;

    // Si Cloudinary, utiliser la transformation
    if (url.includes('cloudinary.com')) {
      return url.replace(
        '/upload/',
        `/upload/w_${getSizePixels(size)},h_${getSizePixels(size)},c_fill,q_auto:best,f_auto/`
      );
    }

    // URL locale avec paramètre de taille
    if (url.startsWith('/uploads')) {
      return `${url}?size=${size}&t=${Date.now()}`;
    }

    return url;
  }, [fallback, defaultSize]);

  /**
   * Mappe la taille à des pixels
   */
  const getSizePixels = (size) => {
    const sizeMap = {
      thumbnail: 300,
      small: 500,
      medium: 800,
      large: 1200,
    };
    return sizeMap[size] || 800;
  };

  /**
   * Précharge l'image dans les différentes tailles
   */
  useEffect(() => {
    if (!imageUrl) {
      setImageState(prev => ({
        ...prev,
        currentUrl: fallback,
        loaded: true,
      }));
      return;
    }

    const loadImage = async () => {
      try {
        // Charger d'abord la petite version (thumbnail)
        const thumbnailUrl = getOptimizedUrl(imageUrl, 'thumbnail');
        
        const img = new Image();
        img.onload = () => {
          // Puis charger la version moyenne
          setImageState(prev => ({
            ...prev,
            currentUrl: getOptimizedUrl(imageUrl, defaultSize),
          }));

          const mediumImg = new Image();
          mediumImg.onload = () => {
            setImageState(prev => ({
              ...prev,
              loaded: true,
              error: false,
              currentUrl: getOptimizedUrl(imageUrl, defaultSize),
            }));
          };
          mediumImg.onerror = () => {
            if (imageState.retries < retryCount) {
              setTimeout(() => {
                setImageState(prev => ({
                  ...prev,
                  retries: prev.retries + 1,
                }));
              }, 1000 * (imageState.retries + 1)); // Backoff exponentiel
            } else {
              setImageState(prev => ({
                ...prev,
                loaded: true,
                error: true,
                currentUrl: fallback,
              }));
            }
          };
          mediumImg.src = getOptimizedUrl(imageUrl, defaultSize);
        };

        img.onerror = () => {
          if (imageState.retries < retryCount) {
            setTimeout(() => {
              setImageState(prev => ({
                ...prev,
                retries: prev.retries + 1,
              }));
            }, 1000 * (imageState.retries + 1));
          } else {
            setImageState(prev => ({
              ...prev,
              loaded: true,
              error: true,
              currentUrl: fallback,
            }));
          }
        };

        img.src = thumbnailUrl;
      } catch (err) {
        console.error('Erreur lors du chargement de l\'image:', err);
        setImageState(prev => ({
          ...prev,
          loaded: true,
          error: true,
          currentUrl: fallback,
        }));
      }
    };

    loadImage();
  }, [imageUrl, defaultSize, fallback, retryCount, imageState.retries, getOptimizedUrl]);

  return {
    ...imageState,
    url: imageState.currentUrl || getOptimizedUrl(imageUrl, defaultSize) || fallback,
  };
};

/**
 * Hook pour précharger les images en arrière-plan
 */
export const useImagePreloader = (urls = []) => {
  useEffect(() => {
    const preloadImages = () => {
      urls.forEach(url => {
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    };

    // Précharger après le rendu initial
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadImages);
    } else {
      setTimeout(preloadImages, 2000); // Fallback: attendre 2s
    }
  }, [urls]);
};

/**
 * Hook pour les images responsives avec srcset
 */
export const useResponsiveImage = (baseUrl) => {
  return {
    srcSet: `
      ${baseUrl}?size=small&w=500 500w,
      ${baseUrl}?size=medium&w=800 800w,
      ${baseUrl}?size=large&w=1200 1200w
    `,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  };
};
