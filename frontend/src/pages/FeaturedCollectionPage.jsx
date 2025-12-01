import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaStar, FaHeart, FaRegHeart, FaChevronDown, FaSearch, FaArrowLeft } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCollectionsStore } from '../store/collectionsStore';
import { useProductStore } from '../store/productStore';
import CustomerSupportChat from '../components/CustomerSupportChat';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const FeaturedCollectionPage = () => {
  const { collectionId } = useParams();
  const { getCollectionById, collections, fetchCollectionsFromAPI } = useCollectionsStore();
  const { products, fetchProductsFromAPI } = useProductStore();

  // Fetch products on mount if not already loaded (supports direct links)
  useEffect(() => {
    if (products.length === 0) {
      fetchProductsFromAPI();
    }
  }, [products.length, fetchProductsFromAPI]);
  
  // Collection and product states
  const [collection, setCollection] = useState(null);
  const [collectionProducts, setCollectionProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState({});
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortOption, setSortOption] = useState('featured');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  
  // Refs
  const filterRef = useRef(null);
  
  // Load collection and products
  useEffect(() => {
    setLoading(true);
    
    // Find collection by ID from store
    const fetchedCollection = getCollectionById(collectionId) || 
      collections.find(c => c._id === collectionId || c.slug === collectionId);
    
    if (fetchedCollection) {
      setCollection(fetchedCollection);
      
      // Get products associated with this collection
      const associatedProducts = products.filter(product => 
        fetchedCollection.products?.includes(product._id)
      );
      
      // Set available price range based on products
      if (associatedProducts.length > 0) {
        const minPrice = Math.min(...associatedProducts.map(p => p.basePrice || p.price || 0));
        const maxPrice = Math.max(...associatedProducts.map(p => p.basePrice || p.price || 0));
        setPriceRange([minPrice, maxPrice]);
      }
      
      setCollectionProducts(associatedProducts);
      setTimeout(() => setLoading(false), 300);
    } else {
      // Fallback: fetch collection and its products directly from API
      axios.get(`${apiConfig.baseURL}/collections/${collectionId}`)
        .then(res => {
          if (res.data.success) {
            const coll = res.data.data;
            setCollection(coll);
            const associatedProducts = Array.isArray(coll.products) ? coll.products : [];
            if (associatedProducts.length > 0) {
              const minPrice = Math.min(...associatedProducts.map(p => p.basePrice || p.price || 0));
              const maxPrice = Math.max(...associatedProducts.map(p => p.basePrice || p.price || 0));
              setPriceRange([minPrice, maxPrice]);
            }
            setCollectionProducts(associatedProducts);
          } else {
            console.error('[FeaturedCollectionPage] API call failed:', res.data);
          }
        })
        .catch(err => console.error('[FeaturedCollectionPage] API fetch error', err))
        .finally(() => setLoading(false));
    }
  }, [collectionId, collections, products, getCollectionById, fetchCollectionsFromAPI]);
  
  // Extract unique categories and sizes from products
  const availableCategories = [...new Set(collectionProducts.map(p => p.category).filter(Boolean))];
  
  const availableSizes = [...new Set(
    collectionProducts.flatMap(p => 
      p.variants?.flatMap(v => v.sizes?.map(s => s.size) || []) || []
    ).filter(Boolean)
  )];
  
  // Filter products based on selected options
  const filteredProducts = collectionProducts.filter(product => {
    const price = product.basePrice || product.price || 0;
    const inPriceRange = price >= priceRange[0] && price <= priceRange[1];
    
    const matchesCategory = selectedCategories.length === 0 || 
      (product.category && selectedCategories.includes(product.category));
    
    const matchesSize = selectedSizes.length === 0 || 
      product.variants?.some(v => 
        v.sizes?.some(s => selectedSizes.includes(s.size))
      );
    
    return inPriceRange && matchesCategory && matchesSize;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return (a.basePrice || a.price || 0) - (b.basePrice || b.price || 0);
      case 'price-desc':
        return (b.basePrice || b.price || 0) - (a.basePrice || a.price || 0);
      case 'newest':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      default: // 'featured'
        return 0; // Maintain original order
    }
  });
  
  // Handle price range change
  const handlePriceRangeChange = (event, index) => {
    const newRange = [...priceRange];
    newRange[index] = Number(event.target.value);
    setPriceRange(newRange);
  };
  
  // Toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Toggle size selection
  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };
  
  // Toggle wishlist
  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  // Reset all filters
  const resetFilters = () => {
    setPriceRange([0, 1000]); 
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSortOption('featured');
  };

  // Get best product image - improved version with better fallbacks
  const getProductImage = (product) => {
    // Check if product exists
    if (!product) return "https://via.placeholder.com/300x400?text=Sinosply";
    
    const variantIndex = hoveredProduct === product._id ? 1 : 0;
    
    // First, try to get variant's additionalImages (this has higher quality images)
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      if (variant.additionalImages && variant.additionalImages.length > 0) {
        return variant.additionalImages[0];
      }
      
      // Then try the variant's main image
      if (variant.image) {
        return variant.image;
      }
    }
    
    // Then try the product's main image
    if (product.image) {
      return product.image;
    }
    
    // Finally use placeholder
    return `https://via.placeholder.com/300x400?text=${encodeURIComponent(product.name || 'Sinosply')}`;
  };

  // Get secondary product image for hover effect - improved version
  const getSecondaryImage = (product) => {
    // Check if product exists
    if (!product) return "https://via.placeholder.com/300x400?text=Sinosply";
    
    // First try to get a second variant image if available
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      if (variant.additionalImages && variant.additionalImages.length > 1) {
        return variant.additionalImages[1];
      }
      
      // Then try a different variant if available
      if (product.variants.length > 1 && product.variants[1].additionalImages && product.variants[1].additionalImages.length > 0) {
        return product.variants[1].additionalImages[0];
      }
    }
    
    // Then try the product's secondary images
    if (product.images && product.images.length > 1) {
      return product.images[1];
    }
    
    // Fallback to the same primary image if no secondary image available
    return getProductImage(product);
  };

  // Handle image load event
  const handleImageLoaded = (productId) => {
    setImageLoaded(prev => ({...prev, [productId]: true}));
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Collection Banner */}
      <div className="relative w-full h-[50vh] bg-gray-900 overflow-hidden">
        {/* Back Button */}
        <Link 
          to="/sinosply-stores" 
          className="absolute top-4 left-4 z-20 bg-white bg-opacity-80 hover:bg-white text-black p-3 rounded-full shadow-md transition-all duration-200 flex items-center justify-center"
          aria-label="Back to collections"
        >
          <FaArrowLeft className="text-lg" />
        </Link>
        
        {collection?.image ? (
          <div className="w-full h-full">
            <img 
              src={collection.image}
              alt={collection?.name}
              className="w-full h-full object-cover opacity-80 transition-transform duration-10000 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse rounded-lg bg-gray-700 w-full h-full"></div>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-wider">{collection?.name || 'Collection'}</h1>
          <p className="text-white text-xl max-w-2xl text-center px-6 font-light">
            {collection?.description || 'Explore our collection of curated products'}
          </p>
        </div>
      </div>
      
      {/* Collection Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumbs */}
        <nav className="mb-10">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/sinosply-stores" className="text-gray-500 hover:text-black">Home</Link></li>
            <li><span className="text-gray-500">/</span></li>
            <li><Link to="/collections" className="text-gray-500 hover:text-black">Collections</Link></li>
            <li><span className="text-gray-500">/</span></li>
            <li className="font-medium">{collection?.name || 'Collection'}</li>
          </ol>
        </nav>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.div 
            ref={filterRef}
            className={`${showFilters ? 'w-full md:w-1/4' : 'w-full md:w-auto'} bg-white`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="sticky top-24 bg-white">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Filters</h2>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <FaFilter className="w-4 h-4" />
                </button>
              </div>
              
              {showFilters && (
                <div className="space-y-8 pb-6 border-b">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-medium mb-4 flex items-center justify-between">
                      <span className="text-lg">Price Range</span>
                      <FaChevronDown className="w-3 h-3 text-gray-500" />
                    </h3>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>GH₵{priceRange[0].toFixed(2)}</span>
                        <span>GH₵{priceRange[1].toFixed(2)}</span>
                      </div>
                      <div className="relative mt-2 px-1">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="absolute h-2 bg-black rounded-full"
                            style={{
                              left: `${(priceRange[0] / 1000) * 100}%`,
                              width: `${((priceRange[1] - priceRange[0]) / 1000) * 100}%`
                            }}
                          ></div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1000}
                          value={priceRange[0]}
                          onChange={(e) => handlePriceRangeChange(e, 0)}
                          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
                        />
                        <input
                          type="range"
                          min={0}
                          max={1000}
                          value={priceRange[1]}
                          onChange={(e) => handlePriceRangeChange(e, 1)}
                          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Min</label>
                        <input 
                          type="number" 
                          value={priceRange[0]}
                          onChange={(e) => handlePriceRangeChange(e, 0)}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Max</label>
                        <input 
                          type="number" 
                          value={priceRange[1]}
                          onChange={(e) => handlePriceRangeChange(e, 1)}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Categories */}
                  {availableCategories.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-4 flex items-center justify-between">
                        <span className="text-lg">Categories</span>
                        <FaChevronDown className="w-3 h-3 text-gray-500" />
                      </h3>
                      <div className="space-y-3">
                        {availableCategories.map((category) => (
                          <div key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`category-${category}`}
                              checked={selectedCategories.includes(category)}
                              onChange={() => toggleCategory(category)}
                              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                            />
                            <label htmlFor={`category-${category}`} className="ml-3 text-sm text-gray-700 hover:text-black cursor-pointer">
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Sizes */}
                  {availableSizes.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-4 flex items-center justify-between">
                        <span className="text-lg">Sizes</span>
                        <FaChevronDown className="w-3 h-3 text-gray-500" />
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSizes.map((size) => (
                          <button
                            key={size}
                            className={`px-3 py-2 text-xs rounded-md ${
                              selectedSizes.includes(size)
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-500'
                            } transition-all duration-200`}
                            onClick={() => toggleSize(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Reset Button */}
                  <button
                    onClick={resetFilters}
                    className="w-full py-3 text-sm font-medium text-gray-600 hover:text-black transition-colors border-t border-gray-200 pt-4 hover:underline"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort Controls */}
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{sortedProducts.length} products</span> in this collection
              </div>
              <div className="flex items-center">
                <label className="text-sm mr-3 text-gray-600">Sort by:</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 h-[350px] rounded-md"></div>
                    <div className="h-4 bg-gray-200 rounded mt-4 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mt-2 w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded mt-2 w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-12">
                {sortedProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                    onMouseEnter={() => setHoveredProduct(product._id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <div className="relative overflow-hidden rounded-md">
                      <Link to={`/product/${product._id}`} onClick={() => console.log(`[FeaturedCollectionPage] Navigating to product details: id=${product._id}, name=${product.name}`)}>
                        <div className="relative w-full h-96 bg-gray-100 overflow-hidden">
                          {/* Primary Image */}
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${hoveredProduct === product._id ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => handleImageLoaded(product._id)}
                            onError={(e) => {
                              console.log(`[Image Error] Failed to load image for ${product.name}, using placeholder`);
                              e.target.onerror = null;
                              e.target.src = `https://via.placeholder.com/300x400?text=${encodeURIComponent(product.name || 'Sinosply')}`;
                            }}
                          />
                          {/* Secondary/Hover Image */}
                          <img
                            src={getSecondaryImage(product)}
                            alt={`${product.name} alternate view`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hoveredProduct === product._id ? 'opacity-100' : 'opacity-0'}`}
                            onError={(e) => {
                              console.log(`[Image Error] Failed to load secondary image for ${product.name}, using primary image`);
                              e.target.onerror = null;
                              e.target.src = getProductImage(product);
                            }}
                          />
                          
                          {/* Loading Overlay */}
                          {!imageLoaded[product._id] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          
                          {/* Quick Shop Button */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-0 translate-y-full group-hover:translate-y-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center">
                            <Link 
                              to={`/product/${product._id}`}
                              className="py-2 px-4 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                              QUICK SHOP
                            </Link>
                          </div>
                        </div>
                      </Link>

                      <button
                        onClick={() => toggleWishlist(product._id)}
                        className="absolute top-3 right-3 p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                        aria-label={wishlist.includes(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        {wishlist.includes(product._id) ? (
                          <FaHeart className="w-4 h-4 text-red-500" />
                        ) : (
                          <FaRegHeart className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* Sale or Sold Out Badge */}
                      {product.salePrice && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium">
                          SALE
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute top-3 left-3 bg-gray-900 text-white px-2 py-1 text-xs font-medium">
                          SOLD OUT
                        </div>
                      )}
                    </div>
                    <div className="mt-4 px-1">
                      <Link to={`/product/${product._id}`} onClick={() => console.log(`[FeaturedCollectionPage] Navigating to product details: id=${product._id}, name=${product.name}`)} className="block">
                        <h3 className="text-md font-medium text-gray-900 group-hover:underline">{product.name}</h3>
                      </Link>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <FaStar
                                key={i}
                                className={`w-3 h-3 ${
                                  i < (product.rating || 0)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">{product.numReviews || 0} reviews</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {product.salePrice ? (
                          <>
                            <p className="text-md font-bold text-red-600">
                              GH₵{(product.salePrice).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 line-through">
                              GH₵{(product.basePrice || product.price || 0).toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-md font-bold text-gray-900">
                            GH₵{(product.basePrice || product.price || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="py-20 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gray-100">
                  <FaSearch className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-2xl font-medium text-gray-700 mb-3">No products found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  We couldn't find any products that match your current filters. Try adjusting your selection or explore other collections.
                </p>
                <button 
                  onClick={resetFilters}
                  className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition-colors rounded-md"
                >
                  Reset Filters
                </button>
              </motion.div>
            )}
            
            {/* Pagination if needed in future */}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">JOIN OUR NEWSLETTER</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors">
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>
      
      <Footer />
      <CustomerSupportChat />
    </div>
  );
};

export default FeaturedCollectionPage; 