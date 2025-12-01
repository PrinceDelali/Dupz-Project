import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaLongArrowAltRight, FaCommentAlt } from 'react-icons/fa';

const ProductExplorer = ({ 
  title = "Sample Products", 
  products = [], 
  showViewAll = true, 
  loading = false,
  disableExploreButton = false 
}) => {
  // Default products if none are provided
  const defaultProducts = [
    {
      name: 'Compressed Sofas',
      description: 'Explore our range of compressed sofas.',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      link: '/products/sofas',
      price: '$599',
      rating: 4.7
    },
    {
      name: 'Bamboo Furniture',
      description: 'Explore our range of bamboo furniture.',
      image: 'https://images.unsplash.com/photo-1540638349517-3abd5afc5847?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      link: '/products/bamboo',
      price: '$399',
      rating: 4.9
    },
    {
      name: 'Smart Gadgets',
      description: 'Explore our range of smart gadgets.',
      image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      link: '/products/gadgets',
      price: '$299',
      rating: 4.5
    }
  ];

  const displayProducts = products.length > 0 ? products : defaultProducts;

  // Product skeleton loader component
  const ProductSkeleton = () => (
    <div className="relative overflow-hidden rounded-lg shadow-md bg-gray-100 animate-pulse">
      <div className="h-[300px] bg-gray-200">
        <div className="absolute top-4 left-4">
          <div className="bg-gray-300 h-6 w-16 rounded-full"></div>
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-300 rounded-full"></div>
                ))}
              </div>
              <div className="ml-1 h-4 w-8 bg-gray-300 rounded"></div>
            </div>
            <div className="h-5 w-16 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 w-36 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-300 rounded mb-4"></div>
          <div className="h-10 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="product-explorer py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simple header without animations */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <div className="h-10 w-1 bg-red-600 rounded-full"></div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
              <div className="h-1 w-20 bg-red-600 rounded-full mt-2"></div>
            </div>
          </div>
          
          {showViewAll && (
            <Link to="/products" className="bg-theme-primary text-white py-2 px-4 rounded-lg hover:bg-theme-secondary transition-colors flex items-center text-sm font-medium">
              View All Products
              <FaLongArrowAltRight className="ml-2" />
            </Link>
          )}
        </div>
        
        {/* Product grid with simplified hover effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Show skeleton loaders when loading
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : (
            // Show actual products when not loading
            displayProducts.map((product, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                key={product.name} 
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
              >
                {disableExploreButton ? (
                  // Non-clickable version for sample products
                  <div className="block">
                    <div className="relative h-[300px] overflow-hidden">
                      {/* Background overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-opacity duration-300 z-10"></div>
                      
                      {/* Product image with simple scale effect */}
                      <img 
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                        }}
                      />
                      
                      {/* Sample label */}
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-red-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">Sample</span>
                      </div>
                      
                      {/* Content overlay */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                        {/* Rating and price row */}
                        <div className="flex justify-between items-center mb-2 text-white">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                                className={`w-4 h-4 ${i < Math.floor(product.rating || 5) ? 'text-yellow-400' : 'text-gray-400'}`}>
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                              </svg>
                            ))}
                            <span className="ml-1 text-sm">{product.rating}</span>
                            
                            {/* Review count */}
                            {product.reviewCount !== undefined && (
                              <div className="flex items-center ml-2 text-white">
                                <FaCommentAlt className="w-3 h-3 text-gray-200" />
                                <span className="ml-1 text-xs">{product.reviewCount}</span>
                              </div>
                            )}
                          </div>
                          <span className="font-bold">{product.price}</span>
                        </div>
                        
                        {/* Product title */}
                        <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                        
                        {/* Product description */}
                        <p className="text-sm text-gray-200 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {product.description}
                        </p>
                        
                        {/* Call to action - disabled for samples */}
                        <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="bg-gray-300 text-gray-600 py-2 px-4 rounded-lg font-medium inline-flex items-center cursor-not-allowed opacity-70">
                            Sample Only
                            <FaLongArrowAltRight className="ml-2" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Clickable version for regular products
                  <Link to={product.link} className="block">
                    <div className="relative h-[300px] overflow-hidden">
                      {/* Background overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-opacity duration-300 z-10"></div>
                      
                      {/* Product image with simple scale effect */}
                      <img 
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                        }}
                      />
                      
                      {/* "New" label */}
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-red-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">New</span>
                      </div>
                      
                      {/* Content overlay */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                        {/* Rating and price row */}
                        <div className="flex justify-between items-center mb-2 text-white">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                                className={`w-4 h-4 ${i < Math.floor(product.rating || 5) ? 'text-yellow-400' : 'text-gray-400'}`}>
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                              </svg>
                            ))}
                            <span className="ml-1 text-sm">{product.rating}</span>
                            
                            {/* Review count */}
                            {product.reviewCount !== undefined && (
                              <div className="flex items-center ml-2 text-white">
                                <FaCommentAlt className="w-3 h-3 text-gray-200" />
                                <span className="ml-1 text-xs">{product.reviewCount}</span>
                              </div>
                            )}
                          </div>
                          <span className="font-bold">{product.price}</span>
                        </div>
                        
                        {/* Product title */}
                        <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                        
                        {/* Product description */}
                        <p className="text-sm text-gray-200 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {product.description}
                        </p>
                        
                        {/* Call to action */}
                        <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="bg-white text-red-600 py-2 px-4 rounded-lg font-medium inline-flex items-center">
                            Explore Now
                            <FaLongArrowAltRight className="ml-2" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductExplorer;