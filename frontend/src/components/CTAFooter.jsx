import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLongArrowAltRight } from 'react-icons/fa';

const CTAFooter = ({ 
  title = "Ready to Source Smarter?", 
  description = "Whether you're a consumer launching an online store or a business importing machinery to Ghana, Sinosply delivers quality, sustainability, and growth.",
  primaryButtonText = "Get a Free Quote Today",
  primaryButtonLink = "/quote",
  secondaryButtonText = "Explore Products",
  secondaryButtonLink = "/products",
  backgroundColor = "bg-gradient-to-r from-gray-100 to-gray-50"
}) => {
  return (
    <motion.section 
      className={`cta-footer relative overflow-hidden py-24 ${backgroundColor}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-gray-800"></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-red-100 opacity-50"></div>
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gray-200 opacity-60"></div>
      
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-white/30 blur-xl rounded-3xl transform rotate-1"></div>
          <div className="relative bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 md:p-12 border border-gray-100">
            {title && (
              <motion.h2 
                className="text-2xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-black"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                {title}
              </motion.h2>
            )}
            
            {description && (
              <motion.p 
                className="text-base md:text-lg text-gray-600 mb-10 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                {description}
              </motion.p>
            )}
            
            <motion.div 
              className="flex flex-wrap justify-center gap-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
            >
              {primaryButtonText && (
                <Link 
                  to={primaryButtonLink} 
                  className="group bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-8 rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center font-medium"
                >
                  {primaryButtonText}
                  <FaLongArrowAltRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              )}
              
              {secondaryButtonText && (
                <Link 
                  to={secondaryButtonLink} 
                  className="group bg-transparent border-2 border-gray-300 text-gray-700 hover:border-black hover:text-black py-4 px-8 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center font-medium"
                >
                  {secondaryButtonText}
                  <FaLongArrowAltRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              )}
            </motion.div>
            
            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
              <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-20 h-20 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-4 h-4 bg-black rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-red-600 via-red-500 to-gray-800"></div>
      </div>
    </motion.section>
  );
};

export default CTAFooter; 