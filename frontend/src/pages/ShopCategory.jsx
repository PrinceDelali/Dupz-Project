import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useProductStore } from '../store/productStore';

const ShopCategory = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // Get products from store
  const { products, featuredProducts, fetchProductsFromAPI, searchProducts } = useProductStore();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch products if they're not already loaded
  useEffect(() => {
    if (products.length === 0) {
      fetchProductsFromAPI();
    }
  }, [products.length, fetchProductsFromAPI]);
  
  // Filter products by category and search term
  useEffect(() => {
    if (products.length > 0) {
      // Log available categories for debugging
      const availableCategories = [...new Set(products.map(p => p.category))];
      console.log('ShopCategory: Available categories:', availableCategories);
      console.log('ShopCategory: Current category param:', category);
      
      let filtered;
      
      if (searchQuery) {
        // Use the store's search functionality
        filtered = searchProducts(searchQuery);
      } else {
        // Use case-insensitive comparison for more reliable matching
        const categoryUpper = category?.toUpperCase() || 'ALL';
        console.log('ShopCategory: Filtering by category (uppercase):', categoryUpper);
        
        filtered = categoryUpper === 'ALL' 
          ? products 
          : products.filter(product => 
              product.category && product.category.toUpperCase() === categoryUpper
            );
      }
      
      console.log(`ShopCategory: Found ${filtered.length} products for category "${category}"`);
      setFilteredProducts(filtered);
      
      // Initialize selected variants
      const initialVariants = {};
      filtered.forEach(product => {
        initialVariants[product._id] = 0;
      });
      setSelectedVariants(initialVariants);
    }
  }, [products, category, searchQuery, searchProducts]);

  const handleColorSelect = (productId, variantIndex) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantIndex
    }));
  };

  const scroll = (direction) => {
    const container = containerRef.current;
    if (!container) return;

    const scrollDistance = 200;
    const currentScroll = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    let newScroll;
    if (direction === 'left') {
      newScroll = Math.max(0, currentScroll - scrollDistance);
    } else {
      newScroll = Math.min(maxScroll, currentScroll + scrollDistance);
    }

    container.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  // Function to get image from variant
  const getImageFromVariant = (variant, product) => {
    return variant?.additionalImages?.[0] || "https://via.placeholder.com/400x500?text=" + encodeURIComponent(product.name);
  };

  const handleProductClick = (product) => {
    // Get the currently selected variant index for this product
    const variantIndex = selectedVariants[product._id] || 0;
    
    // Navigate to product details with minimal information
    // Product details page will fetch complete data from the store
    navigate(`/product/${product._id}`, { 
      state: {
        productId: product._id,
        variantIndex: variantIndex
      }
    });
  };

  // Filter for new products (last 30 days or featured)
  const newArrivalsProducts = products.filter(product => 
    product.isFeatured || 
    (product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  ).slice(0, 12); // Limit to 12 products

  return (
    <div className="max-w-[1200px] mx-auto px-4">
      <h1 className="text-center text-2xl font-bold my-6">NEW ARRIVALS</h1>

      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
        >
          <FaChevronLeft className="text-xl" />
        </button>

        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth px-4 no-scrollbar"
          style={{ 
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {newArrivalsProducts.map((product) => {
            const variantIndex = selectedVariants[product._id] || 0;
            const variants = product.variants || [];
            const selectedVariant = variants[variantIndex];

            return (
              <div 
                key={product._id} 
                className="flex-none w-[200px] cursor-pointer"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => handleProductClick(product)}
              >
                <div className="relative">
                  <div className="aspect-[3/4] overflow-hidden">
                  <img
                      src={selectedVariant ? getImageFromVariant(selectedVariant, product) : "https://via.placeholder.com/400x500?text=" + encodeURIComponent(product.name)}
                    alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-xs font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.salePrice > 0 ? (
                        <>
                          <span className="line-through mr-2">GH₵{product.basePrice.toFixed(2)}</span>
                          <span className="text-red-600">GH₵{product.salePrice.toFixed(2)}</span>
                        </>
                      ) : (
                        `GH₵${product.basePrice.toFixed(2)}`
                      )}
                    </p>
                    {variants.length > 0 && (
                    <div className="mt-2 flex gap-1">
                        {variants.map((variant, index) => (
                        <button
                          key={index}
                          className={`w-3 h-3 rounded-full border border-gray-300 ${
                            variantIndex === index ? 'ring-1 ring-black ring-offset-1' : ''
                          }`}
                            style={{ backgroundColor: variant.color || "#000000" }}
                          onClick={(e) => {
                            e.stopPropagation();
                              handleColorSelect(product._id, index);
                          }}
                        />
                      ))}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
        >
          <FaChevronRight className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default ShopCategory;

