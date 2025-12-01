import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Importing better-looking arrows from react-icons
import { useProductStore } from '../store/productStore';

const FashionShop = () => {
  const navigate = useNavigate();
  const categories = [
    'NEW ARRIVALS',
    'BEST SELLERS', 
    'HAIR',
    'GADGETS',
    'EXCLUSIVES',
    'BACK IN STOCK'
  ];

  // Get products from store
  const { products, featuredProducts, fetchProductsFromAPI } = useProductStore();
  
  // Fetch products if they're not already loaded
  useEffect(() => {
    if (products.length === 0) {
      fetchProductsFromAPI();
    }
  }, [products.length, fetchProductsFromAPI]);

  // Modify the scroll function to use actual product count
  const scroll = (direction) => {
    const container = document.getElementById('product-carousel');
    if (container) {
      const cardWidth = 220;
      const gap = 24;
      const scrollAmount = (cardWidth + gap) * 5;
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Update the products state to use the product store
  const [selectedCategory, setSelectedCategory] = useState('NEW ARRIVALS');
  const [selectedVariants, setSelectedVariants] = useState({});
  
  // Initialize selected variants when products change
  useEffect(() => {
    if (products.length > 0) {
      const initialVariants = {};
      products.forEach(product => {
        initialVariants[product._id] = 0;
      });
      setSelectedVariants(initialVariants);
    }
  }, [products]);

  const handleColorSelect = (productId, variantIndex) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantIndex,
    }));
  };

  // Apply category filter
  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter((product) => {
        // Check if product category matches selected category (case insensitive)
        return product.category?.toUpperCase() === selectedCategory ||
               // Check if product is featured for "BEST SELLERS"
               (selectedCategory === 'BEST SELLERS' && product.isFeatured) ||
               // Check if product is new for "NEW ARRIVALS" (added in the last 30 days)
               (selectedCategory === 'NEW ARRIVALS' && 
                new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
               // Check if product stock was recently updated for "BACK IN STOCK"
               (selectedCategory === 'BACK IN STOCK' && product.stock > 0);
      });

  const handleProductClick = (product) => {
    // Get the currently selected variant index
    const variantIndex = selectedVariants[product._id] || 0;
    
    // Navigate to product details with minimum required information
    // Product details page will use the ID to get full product info from the store
    navigate(`/product/${product._id}`, { 
      state: { 
        productId: product._id,
        variantIndex: variantIndex
      }
    });
  };

  // Function to get color from variant
  const getColorFromVariant = (variant) => {
    return variant?.color || "#000000";
  };
  
  // Function to get image from variant
  const getImageFromVariant = (variant, product) => {
    return variant?.additionalImages?.[0] || "https://via.placeholder.com/400x500?text=" + encodeURIComponent(product.name);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4">
      <h1 className="text-center text-2xl font-bold my-6">NEW ARRIVALS</h1>

      <div className="relative mb-8 overflow-hidden">
        <div className="flex overflow-x-auto pb-2 hide-scrollbar snap-x scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex space-x-2 md:space-x-4 px-4 md:justify-center min-w-full">
        {categories.map((category) => (
          <button
            key={category}
                className={`whitespace-nowrap px-4 py-1 text-sm snap-start flex-shrink-0 ${
              selectedCategory === category
                ? 'bg-black text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
          </div>
        </div>
        <div className="absolute pointer-events-none inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent md:hidden"></div>
        <div className="absolute pointer-events-none inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent md:hidden"></div>
      </div>

      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow-md hover:bg-white"
        >
          <FaChevronLeft className="text-xl" />
        </button>

        <div 
          id="product-carousel"
          className="flex gap-6 overflow-x-auto hide-scrollbar scroll-smooth px-8"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {filteredProducts.map((product) => {
            const variantIndex = selectedVariants[product._id] || 0;
            const variants = product.variants || [];
            const selectedVariant = variants[variantIndex];
            
            return (
              <div 
                key={product._id} 
                className="flex-none w-[220px] cursor-pointer"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => handleProductClick(product)}
              >
                <div className="relative">
                  <img
                    src={getImageFromVariant(selectedVariant, product)}
                    alt={product.name}
                    className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="mt-2">
                    <h3 className="text-xs font-medium">{product.name}</h3>
                    <p className="text-xs mt-1">
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
                    <div className="flex gap-1.5 mt-2">
                        {variants.map((variant, index) => (
                        <button
                          key={index}
                            style={{ backgroundColor: getColorFromVariant(variant) }}
                          className={`w-4 h-4 rounded-full ${
                              selectedVariants[product._id] === index
                              ? 'ring-1 ring-black ring-offset-1'
                              : ''
                          }`}
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
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow-md hover:bg-white"
        >
          <FaChevronRight className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default FashionShop;
