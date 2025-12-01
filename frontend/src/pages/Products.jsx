import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import CTAFooter from '../components/CTAFooter';
import { FaFilter, FaSearch, FaTimes, FaShoppingBag, FaHeart, FaStar, FaGlobe, FaStore, FaLongArrowAltRight, FaChevronRight, FaUsers, FaCubes, FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { useProductStore } from '../store/productStore';
import { usePlatformsStore } from '../store/platformsStore';
import '../styles/Home.css';
import '../styles/Products.css';

const Products = () => {
  const navigate = useNavigate();
  const { category: urlCategory } = useParams();
  
  // Get products and methods from product store
  const { 
    products, 
    categories, 
    filteredProducts,
    fetchProductsFromAPI, 
    searchProducts, 
    filterByCategory,
    filterByPlatform,
    getProductsByCategory,
    getProductsByPlatformAndCategory
  } = useProductStore();
  
  // Get platforms from platforms store
  const {
    platforms,
    activePlatforms,
    fetchPlatformsFromAPI,
    getPlatformById,
    loading: platformsLoading
  } = usePlatformsStore();
  
  // State for filters
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [showProductPreview, setShowProductPreview] = useState(null);

  // Fetch platforms when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('Fetching platforms from API in Products.jsx');
        await fetchPlatformsFromAPI();
        setLoading(false);
      } catch (err) {
        console.error('Error loading platforms data:', err);
        setError('Failed to load stores. Please try again later.');
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchPlatformsFromAPI]);

  // Use activePlatforms as the primary data source
  const storeData = useMemo(() => {
    console.log('Active platforms data:', activePlatforms);
    if (activePlatforms && activePlatforms.length > 0) {
      return activePlatforms;
    }
    return [];
  }, [activePlatforms]);
  
  // Combine platform data with additional descriptions
  const enhancedStoreData = useMemo(() => {
    return storeData.map(store => {
      // Get featured products for this platform
      const featuredProducts = products.filter(product => 
        store.featuredProducts?.includes(product._id)
      );
      
      return {
        ...store,
        description: store.description || '',
        longDescription: store.longDescription || '',
        domain: store.domain || '',
        sampleProducts: featuredProducts
      };
    });
  }, [storeData, products]);

  // Fetch products and platforms when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // If we don't have products yet, fetch them
        if (products.length === 0) {
          await fetchProductsFromAPI();
        }
        
        // Apply any URL category filter
        if (urlCategory && urlCategory !== 'all') {
          setSelectedCategory(urlCategory);
          filterByCategory(urlCategory);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchProductsFromAPI, products.length, urlCategory, filterByCategory]);
  
  // Update product list when filters change
  const applyFilters = useCallback(() => {
    let result = [...products];
    
    // Apply platform and category filters together
    if (selectedPlatform !== 'all' || (selectedCategory !== 'all' && selectedCategory)) {
      result = getProductsByPlatformAndCategory(
        selectedPlatform !== 'all' ? selectedPlatform : null,
        selectedCategory
      );
    }
    
    // Apply search query if not empty
    if (searchQuery.trim()) {
      result = searchProducts(searchQuery);
      
      // If we have filters, we need to apply them to search results
      if (selectedCategory && selectedCategory !== 'all') {
        result = result.filter(product => product.category === selectedCategory);
      }
      
      if (selectedPlatform && selectedPlatform !== 'all') {
        result = result.filter(product => product.platformId === selectedPlatform);
      }
    }
    
    // Apply price range filter
    result = result.filter(product => {
      const price = typeof product.basePrice === 'number' ? product.basePrice : parseFloat(product.basePrice || 0);
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => {
          const priceA = typeof a.basePrice === 'number' ? a.basePrice : parseFloat(a.basePrice || 0);
          const priceB = typeof b.basePrice === 'number' ? b.basePrice : parseFloat(b.basePrice || 0);
          return priceA - priceB;
        });
        break;
      case 'price-high':
        result.sort((a, b) => {
          const priceA = typeof a.basePrice === 'number' ? a.basePrice : parseFloat(a.basePrice || 0);
          const priceB = typeof b.basePrice === 'number' ? b.basePrice : parseFloat(b.basePrice || 0);
          return priceB - priceA;
        });
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        break;
    }
    
    setDisplayProducts(result);
  }, [
    products, 
    selectedCategory,
    selectedPlatform, 
    searchQuery, 
    priceRange, 
    sortBy, 
    getProductsByCategory,
    getProductsByPlatformAndCategory, 
    searchProducts
  ]);
  
  // Apply filters when filter states change
  useEffect(() => {
    if (!loading) {
      applyFilters();
    }
  }, [loading, applyFilters]);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters();
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    
    // Update URL to reflect category
    if (newCategory === 'all') {
      navigate('/products');
    } else {
      navigate(`/products/${newCategory}`);
    }
  };
  
  // Handle platform change
  const handlePlatformChange = (e) => {
    setSelectedPlatform(e.target.value);
  };

  // Get platform info for a product
  const getPlatformInfo = (platformId) => {
    if (!platformId) return null;
    return getPlatformById(platformId);
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Get store URL from domain
  const getStoreUrl = (domain) => {
    if (!domain) return '#';
    
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      return domain;
    }
    
    return `https://${domain}`;
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setSearchQuery('');
    setPriceRange({ min: 0, max: 5000 });
    setSortBy('newest');
    navigate('/products');
  };

  // Toggle mobile filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Handle product click - navigate to product details page
  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`, { 
      state: { 
        productId: product._id,
        variantIndex: 0 
      } 
    });
  };
  
  // Get image for product - with fallbacks for different product structures
  const getProductImage = (product) => {
    // If product has direct image
    if (product.image) {
      return product.image;
    }
    
    // Check for variant images
    if (product.variants && product.variants.length > 0) {
      // First try the variant image
      if (product.variants[0].image) {
        return product.variants[0].image;
      }
      
      // Next try additional images of first variant
      if (product.variants[0].additionalImages && product.variants[0].additionalImages.length > 0) {
        return product.variants[0].additionalImages[0];
      }
    }
    
    // Fallback to placeholder
    return `https://via.placeholder.com/400x500?text=${encodeURIComponent(product.name || 'Product')}`;
  };

  // Handle store mouse enter for hover effects
  const handleStoreHover = (id) => {
    setActiveStore(id);
  };

  // Handle toggle product preview
  const toggleProductPreview = (id) => {
    if (showProductPreview === id) {
      setShowProductPreview(null);
    } else {
      setShowProductPreview(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar />
      
      {/* Hero Banner */}
      <section className="relative bg-black pt-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute h-96 w-96 -left-24 -top-24 bg-red-700 rounded-full blur-3xl"></div>
          <div className="absolute h-96 w-96 right-0 top-48 bg-red-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="bg-gradient-to-r from-black via-black to-red-900 py-20 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Our Partner Brands
              </motion.h1>
              
              <motion.p
                className="text-xl text-gray-200 max-w-3xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Each of our partner brands brings you factory‑direct selection, quality guarantees, and fast, trackable delivery—backed by the same Sinosply expertise.
              </motion.p>
              
              <motion.div 
                className="mt-8 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <a 
                  href="#stores" 
                  className="inline-flex items-center px-8 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
                >
                  Explore Stores
                  <motion.span 
                    className="ml-2"
                    animate={{ y: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    ↓
                  </motion.span>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stores Section */}
      <section id="stores" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {loading || platformsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
              {error}
            </div>
          ) : (
            <div className="space-y-24">
              {enhancedStoreData.map((store, index) => (
                <motion.div 
                  key={store._id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative ${index !== enhancedStoreData.length - 1 ? 'pb-16 border-b border-gray-200' : ''}`}
                  onMouseEnter={() => handleStoreHover(store._id)}
                  onMouseLeave={() => handleStoreHover(null)}
                >
                  {/* Decorative elements */}
                  <div className="hidden md:block absolute -right-16 top-0 h-64 w-64 bg-red-50 rounded-full opacity-30 z-0"></div>
                  {index % 2 === 1 && (
                    <div className="hidden md:block absolute -left-16 bottom-0 h-40 w-40 bg-red-50 rounded-full opacity-30 z-0"></div>
                  )}
                  
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center mb-8">
                    {/* Store image */}
                    <div className="w-full md:w-1/2 order-1 md:order-none">
                      <motion.div 
                        className="relative overflow-hidden rounded-lg aspect-[4/3] shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img 
                          src={store.logoUrl || store.bannerUrl}
                          alt={store.name} 
                          className="w-full h-full object-cover transition-all duration-700 hover:scale-110"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/600x450?text=" + store.name;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="text-2xl md:text-3xl font-bold">{store.name}</h3>
                          <p className="text-white/90">{store.description}</p>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Store details */}
                    <div className="w-full md:w-1/2 order-2 md:order-none">
                      <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
                        <div className="flex items-center mb-3">
                          <FaStore className="text-red-600 mr-2 text-xl" />
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{store.name}</h3>
                        </div>
                        
                        <h4 className="text-xl font-semibold text-gray-700 mb-4">{store.description}</h4>
                        
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          {store.longDescription}
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                          {store.domain && (
                            <a 
                              href={getStoreUrl(store.domain)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                              Visit Store <FaExternalLinkAlt className="ml-2 text-sm" />
                            </a>
                          )}
                          
                          <button
                            onClick={() => toggleProductPreview(store._id)}
                            className="inline-flex items-center px-6 py-3 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                          >
                            {showProductPreview === store._id ? 'Hide Products' : 'Preview Products'}
                            {showProductPreview === store._id ? (
                              <motion.span
                                animate={{ rotate: 90 }}
                                initial={{ rotate: 0 }}
                                transition={{ duration: 0.3 }}
                                className="ml-2"
                              >
                                <FaChevronRight />
                              </motion.span>
                            ) : (
                              <FaChevronRight className="ml-2" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Preview Section */}
                  <AnimatePresence>
                    {showProductPreview === store._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="py-6 mt-4">
                          <h4 className="text-xl font-semibold mb-6 flex items-center">
                            <FaInfoCircle className="text-red-600 mr-2" /> 
                            Featured products from {store.name}
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {store.sampleProducts && store.sampleProducts.map((product, idx) => (
                              <motion.div
                                key={idx}
                                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                                whileHover={{ 
                                  y: -5,
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                }}
                              >
                                <div className="h-48 overflow-hidden">
                                  <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                  />
                                </div>
                                <div className="p-4">
                                  <h5 className="font-bold text-gray-900 mb-1">{product.name}</h5>
                                  <div className="flex justify-between items-center">
                                    <p className="text-red-600 font-semibold">{formatPrice(product.price)}</p>
                                    <button className="p-2 rounded-full bg-gray-100 hover:bg-red-600 hover:text-white transition-colors">
                                      <FaShoppingBag size={14} />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          
                          {store.domain && (
                            <div className="flex justify-center mt-8">
                              <a 
                                href={getStoreUrl(store.domain)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                              >
                                View all products <FaLongArrowAltRight className="ml-2" />
                              </a>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Partnership CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-24 rounded-2xl overflow-hidden shadow-xl relative"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black to-gray-800"></div>
              <div className="absolute -right-24 -top-24 h-64 w-64 bg-red-600/30 rounded-full blur-3xl"></div>
              <div className="absolute -left-24 -bottom-24 h-64 w-64 bg-red-800/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative p-8 md:p-12 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <FaStore className="text-red-600 text-2xl" />
              </motion.div>
              
              <motion.h3 
                className="text-2xl md:text-3xl font-bold mb-4 text-white"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Want to launch your own niche store?
              </motion.h3>
              
              <motion.p 
                className="mb-8 text-gray-300 max-w-2xl mx-auto text-lg"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Ask us about our Brand Partnership program—launch faster, manage smarter, and grow without inventory headaches.
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Link 
                  to="/contact" 
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-transform"
                >
                  Contact Us <FaLongArrowAltRight className="ml-2" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section */}
      <CTAFooter />
      
      <Footer />
    </div>
  );
};

export default Products; 