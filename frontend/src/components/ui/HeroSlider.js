import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const HeroSlider = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
        >
          <div className="h-full relative">
            {/* Image optimisée */}
            <img
              src={slide.image}
              alt={slide.title || 'Banner'}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchpriority={index === 0 ? 'high' : 'low'}
              decoding={index === 0 ? 'sync' : 'async'}
              width="1920"
              height="700"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-gray-900/90 to-blue-900/80"></div>

            {/* Pattern Overlay */}
            <div className="absolute inset-0 pattern-overlay opacity-20"></div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl mx-auto text-center">

                  {/* Collection Badge */}
                  <div className="mb-6 fade-in-up">
                    <span className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white text-sm font-bold rounded-full uppercase tracking-wider">
                      ✨ Nouvelle Collection ✨
                    </span>
                  </div>

                  {/* Main Title */}
                  <h1
                    className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 fade-in-up heading-premium"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: 'white',
                      textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                      animationDelay: '0.2s'
                    }}
                  >
                    <span className="block">DELTA</span>
                    <span className="block text-blue-400">FASHION</span>
                  </h1>

                  {/* Subtitle */}
                  <p
                    className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-4 fade-in-up"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 300,
                      letterSpacing: '2px',
                      animationDelay: '0.4s'
                    }}
                  >
                    {slide.title}
                  </p>

                  {/* Description */}
                  <p
                    className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto fade-in-up"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      animationDelay: '0.6s'
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  {/* CTA Button */}
                  <div className="fade-in-up" style={{ animationDelay: '0.8s' }}>
                    <Link
                      to={slide.link}
                      className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl text-sm md:text-base"
                    >
                      {slide.buttonText}
                      <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 md:left-10 top-1/2 transform -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/50 bg-white/10 backdrop-blur-md hover:bg-blue-600 hover:border-blue-600 text-white transition-all duration-300 flex items-center justify-center hover:scale-110"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-6 md:right-10 top-1/2 transform -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/50 bg-white/10 backdrop-blur-md hover:bg-blue-600 hover:border-blue-600 text-white transition-all duration-300 flex items-center justify-center hover:scale-110"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${index === currentSlide
              ? 'w-10 h-3 bg-blue-500 shadow-lg'
              : 'w-3 h-3 bg-white/50 hover:bg-white/75 hover:scale-110'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
