import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create context
const WishlistContext = createContext();

// Custom hook to use wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  // Initialize wishlist from localStorage if available
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      return [];
    }
  });
  
  const [wishlistCount, setWishlistCount] = useState(0);
  
  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
      
      // Update wishlist count
      setWishlistCount(wishlistItems.length);
    } catch (error) {
      console.error('Error updating wishlist state:', error);
    }
  }, [wishlistItems]);
  
  // Add item to wishlist
  const addToWishlist = useCallback((product) => {
    try {
      setWishlistItems(prevItems => {
        // Check if item already exists in wishlist
        const existingItem = prevItems.find(
          item => item.id === product.id && 
                 item.size === product.size && 
                 item.color === product.color
        );
        
        if (existingItem) {
          // Item already exists in wishlist
          return prevItems;
        } else {
          // Add new item to wishlist
          return [...prevItems, {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            color: product.color,
            colorName: product.colorName,
            size: product.size
          }];
        }
      });
      
      return true; // Return success state
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      return false;
    }
  }, []);
  
  // Remove item from wishlist
  const removeFromWishlist = useCallback((id, size, color) => {
    try {
      setWishlistItems(prevItems => 
        prevItems.filter(item => 
          !(item.id === id && item.size === size && item.color === color)
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      return false;
    }
  }, []);
  
  // Toggle item in wishlist (add if not present, remove if present)
  const toggleWishlistItem = useCallback((product) => {
    try {
      // Check if item is already in wishlist
      const isItemInWishlist = wishlistItems.some(
        item => item.id === product.id && 
               item.size === product.size && 
               item.color === product.color
      );
      
      if (isItemInWishlist) {
        // Remove from wishlist
        removeFromWishlist(product.id, product.size, product.color);
        return { action: 'removed', success: true };
      } else {
        // Add to wishlist
        addToWishlist(product);
        return { action: 'added', success: true };
      }
    } catch (error) {
      console.error('Error toggling wishlist item:', error);
      return { action: 'error', success: false };
    }
  }, [wishlistItems, addToWishlist, removeFromWishlist]);
  
  // Check if product exists in wishlist
  const isInWishlist = useCallback((id, size, color) => {
    try {
      return wishlistItems.some(item => 
        item.id === id && item.size === size && item.color === color
      );
    } catch (error) {
      console.error('Error checking if item is in wishlist:', error);
      return false;
    }
  }, [wishlistItems]);
  
  // Clear entire wishlist
  const clearWishlist = useCallback(() => {
    try {
      setWishlistItems([]);
      return true;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return false;
    }
  }, []);
  
  // Values for the context provider
  const value = {
    wishlistItems,
    wishlistCount,
    addToWishlist,
    removeFromWishlist,
    toggleWishlistItem,
    isInWishlist,
    clearWishlist
  };
  
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext; 