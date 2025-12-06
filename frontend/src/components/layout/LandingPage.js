import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import deltaLogo from '../../assets/logo/delta.jpg';

const LandingPage = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animation de progression
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => onComplete(), 500);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-white"
            >
                {/* Contenu centré */}
                <div className="relative flex flex-col items-center justify-center">

                    {/* Logo au centre */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 0.2,
                        }}
                        className="relative z-10 mb-12"
                    >
                        {/* Logo circulaire avec bordure */}
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full border-[6px] border-black"></div>
                            <img
                                src={deltaLogo}
                                alt="Delta Fashion"
                                className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border-[6px] border-white relative"
                                style={{ boxShadow: '0 0 0 6px black' }}
                            />
                        </div>
                    </motion.div>

                    {/* Texte sous le logo */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-black mb-3 tracking-tight">
                            Delta Fashion
                        </h1>
                        <p className="text-gray-600 text-lg md:text-xl font-light tracking-wide">
                            Élégance Moderne
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LandingPage;
