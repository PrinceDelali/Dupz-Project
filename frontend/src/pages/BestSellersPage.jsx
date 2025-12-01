import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFilter, FaTimes, FaHeart, FaRegHeart, FaShoppingBag } from 'react-icons/fa';
import { useProductStore } from '../store/productStore';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import apiConfig from '../config/apiConfig';
import { useToast } from '../components/ToastManager';

const BestSellersPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  // Get product store functions
  const { 
    products: allProducts, 
    getProductsByCategory,
    fetchProductsFromAPI
  } = useProductStore();
  
  // Get wishlist functions
  const { wishlist = [], addToWishlist, removeFromWishlist } = useWishlist();
  
  // Get cart functions
  const { addToCart } = useCart();

  const { cartNotification } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  const fetchProducts = async () => {
    console.log('📝 BestSellersPage: Fetching BEST SELLERS products');
    setLoading(true);
    
    try {
      // First check if we have products in the store
      if (allProducts && allProducts.length > 0) {
        console.log(`📝 BestSellersPage: Found ${allProducts.length} products in store, filtering by category`);
        // Use the store's function to get BEST SELLERS products
        const categoryProducts = getProductsByCategory('BEST SELLERS');
        console.log(`📝 BestSellersPage: Found ${categoryProducts.length} products in BEST SELLERS category`);
        
        // Apply client-side sorting
        const sortedProducts = sortProducts(categoryProducts);
        setProducts(sortedProducts);
      } else {
        console.log('📝 BestSellersPage: No products in store, fetching from API');
        // Fetch all products first
        await fetchProductsFromAPI();
        
        // Then filter for BEST SELLERS
        const categoryProducts = getProductsByCategory('BEST SELLERS');
        console.log(`📝 BestSellersPage: Fetched ${categoryProducts.length} products in BEST SELLERS category from API`);
        
        // If still no products, try direct API call for just BEST SELLERS
        if (!categoryProducts || categoryProducts.length === 0) {
          console.log('📝 BestSellersPage: Making direct API call for BEST SELLERS category');
          const response = await axios.get(`${apiConfig.baseURL}/products`, {
            params: {
              category: 'BEST SELLERS',
              limit: 50,
              sort: getSortParam()
            }
          });
          
          if (response.data.success) {
            console.log(`📝 BestSellersPage: Received ${response.data.data.length} products directly from API`);
            
            // Log product categories to check if they're correctly categorized
            if (response.data.data.length > 0) {
              console.log('📝 Product Categories from API:');
              response.data.data.forEach(product => {
                console.log(`   - ${product.name}: ${product.category}`);
              });
            }
            
            const sortedProducts = sortProducts(response.data.data);
            setProducts(sortedProducts);
          } else {
            console.error('📝 BestSellersPage: API call unsuccessful', response.data);
          }
        } else {
          // Apply client-side sorting
          const sortedProducts = sortProducts(categoryProducts);
          setProducts(sortedProducts);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching BEST SELLERS products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortParam = () => {
    console.log(`📝 BestSellersPage: Getting sort parameter for ${sortBy}`);
    switch (sortBy) {
      case 'price-asc':
        return 'price';
      case 'price-desc':
        return '-price';
      case 'name-asc':
        return 'name';
      case 'name-desc':
        return '-name';
      case 'newest':
      default:
        return '-createdAt';
    }
  };

  const sortProducts = (productArray) => {
    console.log(`📝 BestSellersPage: Sorting ${productArray.length} products by ${sortBy}`);
    const productsToSort = [...productArray];
    
    switch (sortBy) {
      case 'price-asc':
        return productsToSort.sort((a, b) => a.basePrice - b.basePrice);
      case 'price-desc':
        return productsToSort.sort((a, b) => b.basePrice - a.basePrice);
      case 'name-asc':
        return productsToSort.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return productsToSort.sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
      default:
        return productsToSort.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    
    // Prevent scrolling when filter panel is open
    document.body.style.overflow = !showFilters ? 'hidden' : 'auto';
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      } else {
        return [...prev, size];
      }
    });
  };

  const handlePriceChange = (e, index) => {
    const newRange = [...priceRange];
    newRange[index] = parseInt(e.target.value);
    setPriceRange(newRange);
  };

  const isInWishlist = (productId) => {
    // Make sure wishlist exists and is an array before calling some()
    return wishlist && Array.isArray(wishlist) && wishlist.some(item => item._id === productId);
  };

  const handleWishlistToggle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if wishlist functions exist
    if (!addToWishlist || !removeFromWishlist) {
      console.error('📝 BestSellersPage: Wishlist functions not available');
      return;
    }
    
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the first variant and its first image
    const variant = product.variants && product.variants.length > 0 
      ? product.variants[0] 
      : null;
    
    const size = product.sizes && product.sizes.length > 0 
      ? product.sizes[0] 
      : null;
    
    if (variant && size) {
      const cartItem = {
        id: product._id,
        name: product.name,
        price: product.basePrice,
        image: variant.additionalImages[0],
        color: variant.color || 'default',
        colorName: variant.colorName || 'Default',
        size: size,
        quantity: 1
      };
      
      if (addToCart(cartItem)) {
        cartNotification(`${product.name} added to cart`, {
          image: variant.additionalImages[0]
        });
      }
    }
  };

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    // Price filter
    if (product.basePrice < priceRange[0] || product.basePrice > priceRange[1]) {
      return false;
    }
    
    // Size filter
    if (selectedSizes.length > 0) {
      if (!product.sizes || !product.sizes.some(size => selectedSizes.includes(size))) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {loading && <LoadingOverlay />}
      
      <div className="container mx-auto max-w-screen-xl px-4 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Best Sellers</h1>
            
            <div className="flex space-x-4">
              <div className="hidden md:block">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
              
              <button
                onClick={toggleFilters}
                className="px-4 py-2 bg-black text-white rounded-md flex items-center"
              >
                <FaFilter className="mr-2" /> Filters
              </button>
            </div>
          </div>
          
          <div className="md:hidden mb-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
          
          {/* Filter Panel */}
          <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${showFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white transform transition-transform ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-semibold">Filters</h3>
                  <button onClick={toggleFilters} className="text-gray-500 hover:text-black">
                    <FaTimes size={20} />
                  </button>
                </div>
                
                <div className="mb-8">
                  <h4 className="text-lg font-medium mb-4">Price Range</h4>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      max={priceRange[1]}
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(e, 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min={priceRange[0]}
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(e, 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="mb-8">
                  <h4 className="text-lg font-medium mb-4">Sizes</h4>
                  <div className="flex flex-wrap gap-3">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`px-4 py-2 border rounded-md ${
                          selectedSizes.includes(size)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto pt-6 border-t">
                  <button
                    onClick={toggleFilters}
                    className="w-full py-3 bg-black text-white rounded-md"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          {!loading && filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-4">😢</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500 mb-8">Try adjusting your filters or check back later</p>
              <button
                onClick={() => {
                  setSelectedSizes([]);
                  setPriceRange([0, 1000]);
                }}
                className="px-6 py-2 bg-black text-white rounded-md"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="group relative"
                  onMouseEnter={() => setHoveredProduct(product._id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm">
                    {product.variants && product.variants[0] && (
                      <>
                        <img
                          src={product.variants[0].additionalImages[0]}
                          alt={product.name}
                          className={`w-full h-full object-cover transition-opacity duration-300 ${
                            hoveredProduct === product._id && product.variants[0].additionalImages.length > 1
                              ? 'opacity-0'
                              : 'opacity-100'
                          }`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                          }}
                        />
                        
                        {product.variants[0].additionalImages.length > 1 && (
                          <img
                            src={product.variants[0].additionalImages[1]}
                            alt={`${product.name} - alternate view`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                              hoveredProduct === product._id ? 'opacity-100' : 'opacity-0'
                            }`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                            }}
                          />
                        )}
                      </>
                    )}
                    
                    {/* Quick actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleWishlistToggle(e, product)}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                        aria-label={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        {wishlist && isInWishlist(product._id) ? (
                          <FaHeart className="text-red-500" />
                        ) : (
                          <FaRegHeart className="text-gray-700" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                        aria-label="Add to bag"
                      >
                        <FaShoppingBag className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold">GH₵ {product.basePrice?.toFixed(2)}</span>
                        {product.salePrice > 0 && (
                          <span className="ml-2 text-xs text-gray-500 line-through">
                            GH₵ {product.salePrice?.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.sizes && (
                        <div className="text-xs text-gray-500">
                          {product.sizes.slice(0, 3).join(', ')}
                          {product.sizes.length > 3 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BestSellersPage; 