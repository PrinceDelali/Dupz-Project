import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Create context
const CartContext = createContext();

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [cartCount, setCartCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Calculate cart count and total amount
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
    
    const amount = cartItems.reduce((total, item) => {
      // Handle both string prices (with currency symbols) and numeric prices
      let price;
      if (typeof item.price === 'string') {
        // Remove currency symbol if it's a string (e.g., "GH₵95.00" or "€95.00")
        price = parseFloat(item.price.replace(/[^\d.]/g, ''));
      } else {
        // Use directly if it's already a number
        price = item.price;
      }
      return total + (price * item.quantity);
    }, 0);
    setTotalAmount(amount);
  }, [cartItems]);
  
  // Add item to cart
  const addToCart = (product) => {
    try {
      console.log('🛒 CartContext: Adding product to cart with shipping data:', {
        id: product.id,
        name: product.name,
        airShippingPrice: product.airShippingPrice,
        airShippingDuration: product.airShippingDuration,
        seaShippingPrice: product.seaShippingPrice,
        seaShippingDuration: product.seaShippingDuration
      });
      
      setCartItems(prevItems => {
        // Handle different product formats (from WishlistPage vs from ProductDetailsPage)
        const productId = product.id;
        const productSize = product.size;
        const productColor = product.selectedColor || product.color;
        const productQuantity = product.quantity || 1;
        const productPrice = product.price || product.salePrice || product.basePrice;
        const productColorName = product.colorName;
        const productImage = product.image;
        
        // Check if this product (with same size and color) already exists in cart
        const existingItemIndex = prevItems.findIndex(
          item => 
            item.id === productId && 
            item.size === productSize && 
            item.color === productColor
        );
        
        // Include shipping data in the cart item
        const shippingData = {
          airShippingPrice: product.airShippingPrice || 0,
          airShippingDuration: product.airShippingDuration || 0,
          seaShippingPrice: product.seaShippingPrice || 0,
          seaShippingDuration: product.seaShippingDuration || 0
        };
        
        console.log('🚢 CartContext: Shipping data being added to cart item:', shippingData);
        
        if (existingItemIndex >= 0) {
          // If item exists, update quantity
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + productQuantity,
            ...shippingData // Make sure shipping data is updated
          };
          
          // Also log the updated cart item
          console.log('🔄 CartContext: Updated existing item in cart with shipping data:', updatedItems[existingItemIndex]);
          
          return updatedItems;
        } else {
          // If item doesn't exist, add new item
          const newItem = {
            id: productId,
            name: product.name,
            price: productPrice,
            image: productImage,
            color: productColor,
            colorName: productColorName,
            size: productSize,
            quantity: productQuantity,
            ...shippingData // Include shipping data
          };
          
          // Log the new cart item
          console.log('➕ CartContext: Added new item to cart with shipping data:', newItem);
          
          return [...prevItems, newItem];
        }
      });
      
      // Show success message in toast
      toast.success(`Item added to your cart!`, {
        position: "bottom-right",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart. Please try again.', {
        position: "bottom-right"
      });
    }
  };
  
  // Update item quantity
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index].quantity = newQuantity;
      return updatedItems;
    });
  };
  
  // Remove item from cart
  const removeFromCart = (index) => {
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      return updatedItems;
    });
  };
  
  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  // Check if product exists in cart
  const isInCart = (id, size, color) => {
    return cartItems.some(item => 
      item.id === id && item.size === size && item.color === color
    );
  };
  
  // Values for the context provider
  const value = {
    cartItems,
    cartCount,
    totalAmount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 