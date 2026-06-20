import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHomeData } from '../store/slices/homeSlice';

const MAX_RETRIES = 8;

/**
 * Relance fetchHomeData si l'API échoue (cold start Render, réseau mobile lent).
 * Corrige le cas où loadedAt reste null et l'effet ne se re-déclenchait pas.
 */
export function useEnsureHomeData() {
  const dispatch = useDispatch();
  const { loadedAt, isLoading, error } = useSelector((state) => state.home);
  const retryCount = useRef(0);

  useEffect(() => {
    if (loadedAt) {
      retryCount.current = 0;
      return undefined;
    }

    if (isLoading) return undefined;

    if (retryCount.current >= MAX_RETRIES) return undefined;

    const delay = retryCount.current === 0 ? 0 : Math.min(2000 * retryCount.current, 8000);

    const timer = setTimeout(() => {
      retryCount.current += 1;
      dispatch(fetchHomeData());
    }, delay);

    return () => clearTimeout(timer);
  }, [dispatch, loadedAt, isLoading, error]);
}
