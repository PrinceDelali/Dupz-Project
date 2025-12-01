import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useProductStore } from '../store/productStore';
import '../styles/ProductSearchDropdown.css';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ProductSearchPage = () => {
  const navigate = useNavigate();
  const { products, loading } = useProductStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef();
  const [animate, setAnimate] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Debounced query for performance
  const debouncedQuery = useDebounce(query, 120);

  // Animate entrance on mount
  useEffect(() => {
    setTimeout(() => setAnimate(true), 10);
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter products
  const filtered = debouncedQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(debouncedQuery.toLowerCase()))
      )
    : products;

  // Handle input change
  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  // Handle result click
  const handleResultClick = (id) => {
    navigate(`/product/${id}`);
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 px-2 md:px-0 transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} animate-fadeIn`}
      style={{ transition: 'opacity 0.5s, transform 0.5s' }}
    >
      {/* Sticky search bar and back button */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3 px-2 py-3 md:py-6">
          <button
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full bg-black text-white hover:bg-gray-900 shadow transition-all text-base font-medium focus:outline-none focus:ring-2 focus:ring-black"
            onClick={handleBack}
            aria-label="Back to previous page"
          >
            <FaArrowLeft className="text-lg" />
            <span className="hidden sm:inline sm:ml-1">Back</span>
          </button>
          <div className="flex-1 flex items-center bg-white rounded-full shadow border border-gray-200 focus-within:ring-2 focus-within:ring-black transition px-3 sm:px-4 py-2">
            <FaSearch className="mr-2 sm:mr-3 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 px-1 sm:px-2 py-1 sm:py-2 bg-transparent outline-none text-base sm:text-lg w-full"
              placeholder={isMobile ? "Search..." : "Search products..."}
              value={query}
              onChange={handleChange}
              aria-label="Search products"
              autoFocus
            />
            {query && (
              <button className="ml-1 sm:ml-2 text-gray-400 hover:text-gray-700 p-1" onClick={handleClear} aria-label="Clear search">
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-4 sm:pt-6 md:pt-10 pb-10">
        {loading ? (
          <div className="p-4 sm:p-8 text-center text-gray-500 text-lg animate-pulse">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 sm:p-8 text-center text-gray-500 text-lg animate-fadeIn">No products found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 animate-fadeInUp">
            {filtered.map((product, idx) => (
              <div
                key={product._id || product.id}
                className="group bg-white rounded-xl sm:rounded-2xl shadow hover:shadow-xl transition cursor-pointer border border-gray-100 hover:border-black flex flex-col overflow-hidden transform hover:-translate-y-1 hover:scale-[1.025] duration-200 animate-fadeInUp"
                style={{ animationDelay: `${idx * 30}ms` }}
                onClick={() => handleResultClick(product._id || product.id)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') handleResultClick(product._id || product.id); }}
                role="button"
                aria-label={`View details for ${product.name}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={product.variants?.[0]?.additionalImages?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  {product.salePrice > 0 && (
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow">SALE</span>
                  )}
                </div>
                <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base truncate mb-0 sm:mb-1">{product.name}</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-2 truncate">{product.category}</div>
                  </div>
                  <div className="font-bold text-black text-base sm:text-lg mt-auto flex items-center gap-2">
                    GH₵ {product.basePrice?.toFixed(2)}
                    {product.salePrice > 0 && (
                      <span className="text-xs text-gray-400 line-through">GH₵ {product.salePrice?.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ProductSearchPage; 