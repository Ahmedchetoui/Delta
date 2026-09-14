import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PLACEHOLDER_IMAGE } from '../../utils/imageUtils';

const renderBrandTitle = (title) => {
  const text = (title || 'DELTA FASHION').trim();
  const spaceIndex = text.indexOf(' ');
  if (spaceIndex === -1) {
    return <span className="block text-blue-400">{text}</span>;
  }
  const first = text.substring(0, spaceIndex);
  const rest = text.substring(spaceIndex + 1);
  return (
    <>
      <span className="block">{first}</span>
      <span className="block text-blue-400">{rest}</span>
    </>
  );
};

const HeroSlider = ({ slides = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

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
    <div className="relative w-full h-[100vh] overflow-hidden bg-slate-900">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
          style={{ willChange: 'opacity' }}
        >
          <div className="h-full relative">
            {/* Image nette, haute résolution, claire et vibrante */}
            <img
              src={slide.image}
              srcSet={slide.imageSrcSet}
              sizes="100vw"
              alt={slide.title || 'Banner'}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              decoding={index === 0 ? 'sync' : 'async'}
              width="1920"
              height="800"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMAGE;
                e.currentTarget.srcset = '';
              }}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[8000ms] ease-out"
              style={{ transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)' }}
            />

            {/* Gradient subtil et clair (plus clair pour laisser briller les visuels et détails du visuel) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none"></div>

            {/* Content */}
            <div className="relative h-full flex items-center pt-14 md:pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl mx-auto text-center">

                  {/* Collection Badge */}
                  {slide.showCollectionBadge !== false && (
                    <div className="mb-6">
                      <span className="inline-block px-6 py-2 bg-black/40 border border-white/40 text-white text-xs md:text-sm font-bold rounded-full uppercase tracking-wider shadow-lg">
                        {slide.collectionBadgeText || '✨ NOUVELLE COLLECTION ✨'}
                      </span>
                    </div>
                  )}

                  {/* Main Title */}
                  {slide.showBrandTitle !== false && (
                    <h1
                      className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 heading-premium tracking-wide select-none"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        color: '#ffffff',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        transform: 'translateZ(0)'
                      }}
                    >
                      {renderBrandTitle(slide.brandTitle)}
                    </h1>
                  )}

                  {/* Subtitle */}
                  <p
                    className="text-xl md:text-2xl lg:text-3xl text-white font-medium mb-3"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      letterSpacing: '1px',
                      textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {slide.title}
                  </p>

                  {/* Description */}
                  <p
                    className="text-base md:text-lg text-white/95 mb-8 max-w-2xl mx-auto"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  {/* CTA Button */}
                  {slide.showButton !== false && slide.buttonText && (
                    <div className="mt-2">
                      <Link
                        to={slide.link}
                        className="inline-flex items-center px-8 py-3.5 md:py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full md:rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl text-sm md:text-base hover:scale-105"
                      >
                        {slide.buttonText}
                        <ArrowRightIcon className="ml-2 h-5 w-5 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows like Alfarouk */}
      {slides.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 w-11 h-11 md:w-13 md:h-13 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/60 text-white border border-white/25 transition-all duration-300 flex items-center justify-center hover:scale-110 z-20"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="h-6 w-6 rtl:rotate-180" />
        </button>
      )}

      {slides.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 w-11 h-11 md:w-13 md:h-13 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/60 text-white border border-white/25 transition-all duration-300 flex items-center justify-center hover:scale-110 z-20"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="h-6 w-6 rtl:rotate-180" />
        </button>
      )}

      {/* Horizontal Bar Indicators like Alfarouk */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-2.5 rtl:space-x-reverse z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-10 md:w-14 bg-blue-500 shadow-md'
                  : 'w-5 md:w-7 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
