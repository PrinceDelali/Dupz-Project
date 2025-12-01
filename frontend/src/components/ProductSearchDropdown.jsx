import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useProductStore } from '../store/productStore';
import '../styles/ProductSearchDropdown.css';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ProductSearchDropdown = () => {
  const navigate = useNavigate();
  const { products, loading } = useProductStore();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef();
  const dropdownRef = useRef();

  // Debounced query for performance
  const debouncedQuery = useDebounce(query, 120);

  // Filter products
  const filtered = debouncedQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(debouncedQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  // Log when products or query changes
  useEffect(() => {
    console.log('[ProductSearchDropdown] Query:', query);
    console.log('[ProductSearchDropdown] Debounced Query:', debouncedQuery);
    console.log('[ProductSearchDropdown] Products loaded:', products.length);
    if (debouncedQuery) {
      console.log('[ProductSearchDropdown] Filtered results:', filtered.map(p => p.name));
    }
  }, [query, debouncedQuery, products, filtered]);

  // Show dropdown if query is not empty
  useEffect(() => {
    setShowDropdown(!!debouncedQuery && filtered.length > 0);
    setHighlighted(0);
    if (!!debouncedQuery && filtered.length > 0) {
      console.log('[ProductSearchDropdown] Dropdown opened');
    } else {
      console.log('[ProductSearchDropdown] Dropdown closed');
    }
  }, [debouncedQuery, filtered.length]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      setHighlighted((prev) => (prev + 1) % filtered.length);
      console.log('[ProductSearchDropdown] ArrowDown pressed, highlighted:', (highlighted + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      setHighlighted((prev) => (prev - 1 + filtered.length) % filtered.length);
      console.log('[ProductSearchDropdown] ArrowUp pressed, highlighted:', (highlighted - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      if (filtered[highlighted]) {
        console.log('[ProductSearchDropdown] Enter pressed, navigating to:', filtered[highlighted].name, filtered[highlighted]._id);
        navigate(`/product/${filtered[highlighted]._id}`);
        setShowDropdown(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      console.log('[ProductSearchDropdown] Escape pressed, dropdown closed');
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
        console.log('[ProductSearchDropdown] Clicked outside, dropdown closed');
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Handle input change
  const handleChange = (e) => {
    setQuery(e.target.value);
    console.log('[ProductSearchDropdown] Input changed:', e.target.value);
  };

  // Handle result click
  const handleResultClick = (id, name) => {
    console.log('[ProductSearchDropdown] Result clicked, navigating to:', name, id);
    navigate(`/product/${id}`);
    setShowDropdown(false);
    setQuery('');
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
    console.log('[ProductSearchDropdown] Input cleared');
  };

  return (
    <div className="product-search-dropdown relative flex-1 max-w-xs mx-2" style={{zIndex: 1200}}>
      <div className="search-input-wrapper flex items-center bg-white rounded-full shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-black transition">
        <FaSearch className="ml-3 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          className="search-input flex-1 px-3 py-2 bg-transparent outline-none text-sm"
          placeholder="Search products..."
          value={query}
          onChange={handleChange}
          onFocus={() => {
            setShowDropdown(!!debouncedQuery && filtered.length > 0);
            console.log('[ProductSearchDropdown] Input focused, dropdown open:', !!debouncedQuery && filtered.length > 0);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search products"
        />
        {query && (
          <button className="clear-btn mr-2 text-gray-400 hover:text-gray-700" onClick={handleClear} aria-label="Clear search">
            <FaTimes />
          </button>
        )}
      </div>
      {showDropdown && (
        <div ref={dropdownRef} className="dropdown product-search-dropdown-fix" style={{zIndex: 2001}}>
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No products found</div>
          ) : (
            <ul>
              {filtered.map((product, idx) => (
                <li
                  key={product._id}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${highlighted === idx ? 'bg-gray-100' : ''}`}
                  onMouseDown={() => handleResultClick(product._id, product.name)}
                  onMouseEnter={() => setHighlighted(idx)}
                >
                  <img
                    src={product.variants?.[0]?.additionalImages?.[0] || 'https://via.placeholder.com/40x40?text=No+Image'}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover mr-3 border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="text-xs text-gray-500 truncate">{product.category}</div>
                  </div>
                  <div className="ml-2 font-semibold text-black whitespace-nowrap">
                    GH₵ {product.basePrice?.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchDropdown; 