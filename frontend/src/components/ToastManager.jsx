import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import { useNavigate } from 'react-router-dom';

// Create context
const ToastContext = createContext();

// Custom hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  
  // Define hideToast first to avoid circular dependency
  const hideToast = useCallback((toastId) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
  }, []);
  
  const showToast = useCallback((type, message, { title, duration = 5000, position = 'top-right', image, autoClose = true, onActionClick, id } = {}) => {
    try {
      const toastId = id || Date.now().toString();
      
      // Create new toast
      const newToast = {
        id: toastId,
        type,
        message,
        title,
        position,
        image,
        autoClose,
        duration,
        onActionClick
      };
      
      setToasts(prevToasts => [...prevToasts, newToast]);
      
      // Automatically remove toast after duration (if autoClose is true)
      if (autoClose && duration) {
        setTimeout(() => hideToast(toastId), duration);
      }
      
      return toastId;
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }, [hideToast]);
  
  // Define helper functions for specific toast types
  const success = useCallback((message, options) => {
    // If id is provided with duration 0, hide the toast instead
    if (options?.id && options?.duration === 0) {
      hideToast(options.id);
      return;
    }
    return showToast('success', message, options);
  }, [showToast, hideToast]);
  
  const error = useCallback((message, options) => {
    // If id is provided with duration 0, hide the toast instead
    if (options?.id && options?.duration === 0) {
      hideToast(options.id);
      return;
    }
    return showToast('error', message, options);
  }, [showToast, hideToast]);
  
  const info = useCallback((message, options) => {
    return showToast('info', message, options);
  }, [showToast]);
  
  const cartNotification = useCallback((message, options) => {
    try {
      // Create a safe action handler that won't crash if navigation fails
      const defaultActionHandler = () => {
        try {
          navigate('/cart');
        } catch (err) {
          console.error('Navigation error:', err);
        }
      };
      
      // Ensure we have a safe message
      const safeMessage = message || 'Item added to cart';
      
      // Merge the options 
      const mergedOptions = { 
        ...options,
        onActionClick: options?.onActionClick || defaultActionHandler
      };
      
      return showToast('cart', safeMessage, mergedOptions);
    } catch (err) {
      console.error('Error showing cart notification:', err);
      // Fallback to simple success notification
      return showToast('success', message || 'Item added to cart', options);
    }
  }, [showToast, navigate]);
  
  const wishlistNotification = useCallback((message, options) => {
    try {
      // Create a safe action handler that won't crash if navigation fails
      const defaultActionHandler = () => {
        try {
          navigate('/profile');
        } catch (err) {
          console.error('Navigation error:', err);
        }
      };
      
      // Ensure we have a safe message
      const safeMessage = message || 'Item added to wishlist';
      
      // Merge the options
      const mergedOptions = { 
        ...options,
        onActionClick: options?.onActionClick || defaultActionHandler
      };
      
      return showToast('wishlist', safeMessage, mergedOptions);
    } catch (err) {
      console.error('Error showing wishlist notification:', err);
      // Fallback to simple success notification
      return showToast('success', message || 'Item added to wishlist', options);
    }
  }, [showToast, navigate]);
  
  // Context value
  const contextValue = {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    info,
    cartNotification,
    wishlistNotification
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Render all active toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          isVisible={true}
          type={toast.type}
          message={toast.message}
          title={toast.title}
          duration={toast.duration}
          position={toast.position}
          image={toast.image}
          autoClose={toast.autoClose}
          onClose={() => hideToast(toast.id)}
          onActionClick={toast.onActionClick}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default ToastContext; 