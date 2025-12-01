import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaLongArrowAltRight, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const HeroSection = ({ slides = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  
  // If no slides are provided, use this default data
  const defaultSlides = [
    {
      id: 1,
      title: "Connecting you to China's best products",
      description: "Discover high-quality products from trusted Chinese manufacturers",
      linkTo: "/quote",
      linkText: "Request any product today",
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
    },
    {
      id: 2,
      title: "Scale your business globally",
      description: "Access our network of over 2,000 trusted suppliers",
      linkTo: "/products",
      linkText: "Explore our catalog",
      bgImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
    },
    {
      id: 3,
      title: "Sustainable sourcing solutions",
      description: "Eco-friendly products with sustainable certifications",
      linkTo: "/quote",
      linkText: "Get a free quote",
      bgImage: "https://images.unsplash.com/photo-1623105666608-4d1924a3fb97?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
    }
  ];
  
  const slideData = slides.length > 0 ? slides : defaultSlides;
  
  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slideData.length);
  };
  
  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slideData.length) % slideData.length);
  };
  
  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };
  
  return (
    <header className="hero-section relative h-[600px] w-full overflow-hidden">
      {/* Slider */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${slideData[currentSlide].bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="flex flex-col justify-center items-center text-center h-full px-4 sm:px-6 lg:px-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
            >
              {slideData[currentSlide].title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-xl mb-6 max-w-2xl text-white"
            >
              {slideData[currentSlide].description}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link
                to={slideData[currentSlide].linkTo}
                className="bg-theme-primary text-white py-3 px-6 rounded-lg hover:bg-theme-secondary transition-all duration-300 flex items-center btn-theme-primary"
              >
                {slideData[currentSlide].linkText}
                <FaLongArrowAltRight className="ml-2" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation Buttons */}
      <div className="absolute z-10 bottom-10 left-0 right-0 flex justify-center space-x-3">
        {slideData.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1);
              setCurrentSlide(index);
            }}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white w-6" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Arrow Controls */}
      <button
        onClick={handlePrev}
        className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-sm transition-all"
        aria-label="Previous slide"
      >
        <FaArrowLeft />
      </button>
      
      <button
        onClick={handleNext}
        className="absolute z-10 right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-sm transition-all"
        aria-label="Next slide"
      >
        <FaArrowRight />
      </button>
    </header>
  );
};

export default HeroSection; 