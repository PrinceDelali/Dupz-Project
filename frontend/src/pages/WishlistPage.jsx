import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  X, 
  ArrowLeft, 
  ShoppingBag,
  Trash,
  Share,
  LayoutGrid,
  List,
  ChevronDown,
  Filter,
  Search,
  AlertTriangle
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ToastManager';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const { success, error } = useToast();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('dateAdded'); // 'dateAdded', 'priceLow', 'priceHigh'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    showColorFilter: false,
    showSizeFilter: false,
    selectedColors: [],
    selectedSizes: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef(null);
  
  // Extract all available colors and sizes from wishlist items
  const availableFilters = useMemo(() => {
    const colors = [];
    const sizes = [];
    
    wishlistItems.forEach(item => {
      if (item.colorName && !colors.includes(item.colorName)) {
        colors.push(item.colorName);
      }
      if (item.size && !sizes.includes(item.size)) {
        sizes.push(item.size);
      }
    });
    
    return { colors: colors.sort(), sizes: sizes.sort() };
  }, [wishlistItems]);
  
  // Apply filters and sorting to wishlist items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...wishlistItems];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.colorName?.toLowerCase().includes(term)
      );
    }
    
    // Apply color filter
    if (filterOptions.selectedColors.length > 0) {
      result = result.filter(item => 
        filterOptions.selectedColors.includes(item.colorName)
      );
    }
    
    // Apply size filter
    if (filterOptions.selectedSizes.length > 0) {
      result = result.filter(item => 
        filterOptions.selectedSizes.includes(item.size)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'priceLow':
        result.sort((a, b) => parseFloat(a.price.replace('€', '')) - parseFloat(b.price.replace('€', '')));
        break;
      case 'priceHigh':
        result.sort((a, b) => parseFloat(b.price.replace('€', '')) - parseFloat(a.price.replace('€', '')));
        break;
      case 'nameAZ':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameZA':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'dateAdded':
      default:
        // Default sort is by date added (most recent first)
        // Assuming the order in the wishlist array is the order they were added
        break;
    }
    
    return result;
  }, [wishlistItems, sortBy, searchTerm, filterOptions]);
  
  const handleRemoveItem = (id, size, color, name) => {
    if (removeFromWishlist(id, size, color)) {
      success(`${name} was removed from your wishlist`);
    } else {
      error('Could not remove item from wishlist');
    }
  };
  
  const handleMoveToCart = (item) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      color: item.color,
      colorName: item.colorName,
      size: item.size,
      quantity: 1
    };
    
    if (addToCart(cartItem)) {
      success(`${item.name} was added to your cart`);
      // Optionally remove from wishlist after adding to cart
      // removeFromWishlist(item.id, item.size, item.color);
    } else {
      error('Could not add item to cart');
    }
  };
  
  const handleClearWishlist = () => {
    setIsModalOpen(true);
  };
  
  const confirmClearWishlist = () => {
    if (clearWishlist()) {
      success('Your wishlist has been cleared');
      setIsModalOpen(false);
    } else {
      error('Could not clear wishlist');
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  const handleShareItem = (item) => {
    try {
      navigator.share({
        title: item.name,
        text: `Check out this ${item.name} on Sinosply.`,
        url: `${window.location.origin}/product/${item.id}`,
      });
    } catch (err) {
      const url = `${window.location.origin}/product/${item.id}`;
      navigator.clipboard.writeText(url);
      success('Link copied to clipboard!');
    }
  };
  
  const toggleColorFilter = (color) => {
    setFilterOptions(prev => {
      const selectedColors = [...prev.selectedColors];
      const index = selectedColors.indexOf(color);
      
      if (index === -1) {
        selectedColors.push(color);
      } else {
        selectedColors.splice(index, 1);
      }
      
      return {
        ...prev,
        selectedColors
      };
    });
  };
  
  const toggleSizeFilter = (size) => {
    setFilterOptions(prev => {
      const selectedSizes = [...prev.selectedSizes];
      const index = selectedSizes.indexOf(size);
      
      if (index === -1) {
        selectedSizes.push(size);
      } else {
        selectedSizes.splice(index, 1);
      }
      
      return {
        ...prev,
        selectedSizes
      };
    });
  };
  
  const clearFilters = () => {
    setFilterOptions({
      showColorFilter: false,
      showSizeFilter: false,
      selectedColors: [],
      selectedSizes: []
    });
    setSearchTerm('');
  };
  
  const addAllToCart = () => {
    if (filteredAndSortedItems.length === 0) {
      error('No items to add to cart');
      return;
    }
    
    try {
      let successCount = 0;
      
      // Create a copy of items to avoid issues with state updates during iteration
      const itemsToAdd = [...filteredAndSortedItems];
      
      // Process in simple loop to avoid complexity
      itemsToAdd.forEach(item => {
        try {
          const cartItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            color: item.color,
            colorName: item.colorName,
            size: item.size,
            quantity: 1
          };
          
          if (addToCart(cartItem)) {
            successCount++;
          }
        } catch (itemError) {
          console.error('Error adding individual item to cart:', itemError);
          // Continue with other items
        }
      });
      
      // Show a simple success message without using complex toast features
      if (successCount > 0) {
        success(`${successCount} item${successCount > 1 ? 's' : ''} added to your cart`);
      } else {
        error('Could not add items to cart');
      }
    } catch (err) {
      console.error('Error adding all items to cart:', err);
      error('An error occurred while adding items to your cart');
    }
  };
  
  // Effect for keyboard handling and focus trap when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Enter' && !e.target.tagName.match(/button|a/i)) {
        // Only trigger confirm if Enter wasn't pressed on a button or link
        confirmClearWishlist();
      } else if (e.key === 'Tab') {
        // This creates a focus trap within the modal
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || [];
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // If shift + tab and on first element, move to last element
        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
        // If tab and on last element, move to first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Save the previously focused element and focus the modal
    const previouslyFocused = document.activeElement;
    if (modalRef.current) {
      modalRef.current.focus();
    }
    
    // Prevent scroll on body while modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus and scroll when modal closes
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fadeIn" onClick={closeModal}>
          <div 
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden transform transition-all animate-slideIn" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-50 p-5 flex items-center border-b border-red-100">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <h3 id="modal-title" className="text-xl font-semibold text-gray-900">Clear Wishlist</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to remove <span className="font-medium">{wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}</span> from your wishlist?
              </p>
              <p className="text-gray-500 text-sm mb-6">
                This action cannot be undone. All selected items will be permanently removed from your wishlist.
              </p>
              
              {wishlistCount > 0 && (
                <div className="mb-6 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Items to be removed:</span>
                    <span className="font-medium">{wishlistCount}</span>
                  </div>
                  
                  {wishlistCount > 3 ? (
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {wishlistItems.slice(0, 3).map((item, index) => (
                        <div key={index} className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        </div>
                      ))}
                      <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                        +{wishlistCount - 3}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {wishlistItems.map((item, index) => (
                        <div key={index} className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  onClick={confirmClearWishlist}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Clear Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-10">
          <Link to="/sinosply-stores" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Continue Shopping
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Heart className="w-8 h-8 mr-3 fill-current text-red-500" />
            My Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
          </h1>
          
          {wishlistItems.length > 0 && (
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleViewMode}
                className="flex items-center text-gray-600 hover:text-gray-900 bg-white p-2 rounded-md border border-gray-200"
                aria-label={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
              >
                {viewMode === 'list' ? (
                  <LayoutGrid className="w-5 h-5" />
                ) : (
                  <List className="w-5 h-5" />
                )}
              </button>
              
              <button 
                onClick={handleClearWishlist}
                className="flex items-center text-gray-600 hover:text-red-500"
              >
                <Trash className="w-4 h-4 mr-1" />
                Clear Wishlist
              </button>
            </div>
          )}
        </div>
        
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any items to your wishlist yet.</p>
            <Link 
              to="/sinosply-stores" 
              className="inline-block bg-black text-white py-3 px-8 rounded-md hover:bg-gray-900 transition-colors"
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {/* Filter and Search Controls */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Search */}
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search your wishlist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                {/* Sort */}
                <div className="relative min-w-[180px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-4 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="dateAdded">Recently Added</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="nameAZ">Name: A to Z</option>
                    <option value="nameZA">Name: Z to A</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Filters */}
                <div className="relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                      onClick={() => setFilterOptions(prev => ({
                        ...prev,
                        showColorFilter: !prev.showColorFilter,
                        showSizeFilter: false
                      }))}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Color Filter
                      <ChevronDown className="ml-2 w-4 h-4" />
                    </button>
                    
                    {filterOptions.showColorFilter && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-2 px-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Filter by Color</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {availableFilters.colors.map(color => (
                              <div key={color} className="flex items-center">
                                <input
                                  id={`color-${color}`}
                                  type="checkbox"
                                  checked={filterOptions.selectedColors.includes(color)}
                                  onChange={() => toggleColorFilter(color)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`color-${color}`} className="ml-2 text-sm text-gray-700">
                                  {color}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                      onClick={() => setFilterOptions(prev => ({
                        ...prev,
                        showSizeFilter: !prev.showSizeFilter,
                        showColorFilter: false
                      }))}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Size Filter
                      <ChevronDown className="ml-2 w-4 h-4" />
                    </button>
                    
                    {filterOptions.showSizeFilter && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-2 px-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Filter by Size</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {availableFilters.sizes.map(size => (
                              <div key={size} className="flex items-center">
                                <input
                                  id={`size-${size}`}
                                  type="checkbox"
                                  checked={filterOptions.selectedSizes.includes(size)}
                                  onChange={() => toggleSizeFilter(size)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`size-${size}`} className="ml-2 text-sm text-gray-700">
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {(filterOptions.selectedColors.length > 0 || filterOptions.selectedSizes.length > 0 || searchTerm) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              {/* Active Filters */}
              {(filterOptions.selectedColors.length > 0 || filterOptions.selectedSizes.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filterOptions.selectedColors.map(color => (
                    <span key={`color-pill-${color}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {color}
                      <button
                        type="button"
                        onClick={() => toggleColorFilter(color)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  
                  {filterOptions.selectedSizes.map(size => (
                    <span key={`size-pill-${size}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Size: {size}
                      <button
                        type="button"
                        onClick={() => toggleSizeFilter(size)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No items match your filters.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              // List View
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {filteredAndSortedItems.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="p-6 flex items-start">
                      <div className="h-36 w-28 flex-shrink-0 overflow-hidden rounded-md cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      </div>
                      
                      <div className="ml-6 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-medium text-gray-900 hover:underline cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Color: {item.colorName} | Size: {item.size}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{item.price}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <button
                            type="button"
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center"
                            onClick={() => handleMoveToCart(item)}
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Add to Cart
                          </button>
                          
                          <button
                            type="button"
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                            onClick={() => handleRemoveItem(item.id, item.size, item.color, item.name)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </button>
                          
                          <button
                            type="button"
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                            onClick={() => handleShareItem(item)}
                          >
                            <Share className="w-4 h-4 mr-2" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAndSortedItems.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                    <div 
                      className="h-64 overflow-hidden cursor-pointer relative"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                        }}
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-2">
                        <button
                          type="button"
                          className="p-2 bg-white rounded-full text-gray-600 hover:text-red-500 shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id, item.size, item.color, item.name);
                          }}
                          aria-label="Remove from wishlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <button
                          type="button"
                          className="p-2 bg-white rounded-full text-gray-600 hover:text-blue-500 shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareItem(item);
                          }}
                          aria-label="Share"
                        >
                          <Share className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 
                        className="font-medium text-gray-900 hover:underline cursor-pointer truncate"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Color: {item.colorName} | Size: {item.size}
                      </p>
                      <p className="font-semibold text-gray-900 mt-2">{item.price}</p>
                      
                      <button
                        type="button"
                        className="w-full mt-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center justify-center"
                        onClick={() => handleMoveToCart(item)}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Wishlist Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Wishlist Summary</h2>
                <span className="text-sm text-gray-500">
                  {filteredAndSortedItems.length} of {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} {filterOptions.selectedColors.length > 0 || filterOptions.selectedSizes.length > 0 ? '(filtered)' : ''}
                </span>
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <Link
                  to="/cart"
                  className="w-full md:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  View Cart
                </Link>
                
                {filteredAndSortedItems.length > 0 && (
                  <button 
                    onClick={addAllToCart}
                    className="w-full md:w-auto px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center justify-center"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add All to Cart {filteredAndSortedItems.length < wishlistCount && '(Filtered Items)'}
                  </button>
                )}
                
                <Link
                  to="/sinosply-stores"
                  className="w-full md:w-auto px-6 py-3 bg-black text-white rounded-md hover:bg-gray-900 flex items-center justify-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default WishlistPage; 