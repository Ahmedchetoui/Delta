import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import deltaLogo from '../../assets/logo/delta.jpg';

const LandingPage = ({ onComplete, isReady = false }) => {
  useEffect(() => {
    if (!isReady) return undefined;

    const timer = setTimeout(onComplete, 500);
    return () => clearTimeout(timer);
  }, [isReady, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      >
        <div className="relative flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className="relative z-10 mb-10 px-6"
          >
            <img
              src={deltaLogo}
              alt="Delta Fashion"
              width="320"
              height="80"
              decoding="sync"
              fetchPriority="high"
              className="h-20 md:h-24 w-auto max-w-[280px] md:max-w-[320px] object-contain object-center"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-3 tracking-tight">
              Delta Fashion
            </h1>
            <p className="text-gray-600 text-lg md:text-xl font-light tracking-wide mb-6">
              Élégance Moderne
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              {isReady ? 'Ouverture...' : 'Chargement de la boutique...'}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LandingPage;
