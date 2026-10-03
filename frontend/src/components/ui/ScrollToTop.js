import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../utils/metaPixel';

/**
 * Component to scroll to top and track SPA page views on route change
 * Place this inside the Router component
 */
function ScrollToTop() {
    const { pathname } = useLocation();
    const isFirstRender = useRef(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Le premier PageView est déjà envoyé lors de l'init ; on trace ici toutes les navigations suivantes
        if (isFirstRender.current) {
            isFirstRender.current = false;
        } else {
            trackPageView();
        }
    }, [pathname]);

    return null;
}

export default ScrollToTop;
