import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertCircle, ShoppingBag, Info, Heart } from 'lucide-react';

// Toast types with their respective styles
const TOAST_TYPES = {
  success: {
    icon: <Check className="w-5 h-5" />,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-400',
    iconColor: 'text-green-500',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-400',
    iconColor: 'text-red-500',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-400',
    iconColor: 'text-blue-500',
  },
  cart: {
    icon: <ShoppingBag className="w-5 h-5" />,
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-gray-800',
    iconColor: 'text-white',
  },
  wishlist: {
    icon: <Heart className="w-5 h-5 fill-current" />,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
  }
};

const Toast = ({ 
  type = 'success', 
  message = 'Notification', 
  title,
  isVisible = true, 
  onClose,
  autoClose = true,
  duration = 3000,
  position = 'top-right',
  image = null,
  onActionClick = null
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Get toast styles based on type (with fallback to info)
  const toastStyles = TOAST_TYPES[type] || TOAST_TYPES.info;
  
  // Define position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };
  
  // Safe close handler
  const safeClose = useCallback(() => {
    try {
      setIsShowing(false);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error closing toast:', err);
      // Force close if handler fails
      setIsShowing(false);
    }
  }, [onClose]);
  
  // Auto close toast after duration
  useEffect(() => {
    setIsShowing(isVisible);
    
    let leaveTimer;
    let closeTimer;
    
    if (isVisible && autoClose) {
      closeTimer = setTimeout(() => {
        setIsLeaving(true);
        leaveTimer = setTimeout(() => {
          safeClose();
        }, 300); // Animation duration
      }, duration);
      
      return () => {
        clearTimeout(closeTimer);
        clearTimeout(leaveTimer);
      };
    }
  }, [isVisible, autoClose, duration, safeClose]);
  
  // Handle close click
  const handleClose = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setIsLeaving(true);
    setTimeout(() => {
      safeClose();
    }, 300); // Animation duration
  };
  
  // Handle action click with error handling
  const handleActionClick = (e) => {
    try {
      if (e) e.stopPropagation();
      if (onActionClick) onActionClick();
    } catch (err) {
      console.error('Error in action click handler:', err);
    }
  };
  
  if (!isShowing) return null;
  
  const positionClass = positionClasses[position] || positionClasses['top-right'];
  
  return (
    <div 
      className={`fixed ${positionClass} z-[9999] transform transition-all duration-300 ease-in-out ${
        isLeaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div 
        className={`flex items-start p-4 rounded-lg shadow-lg border ${toastStyles.bgColor} ${toastStyles.textColor} ${toastStyles.borderColor} max-w-md`}
        role="alert"
      >
        {(type === 'cart' || type === 'wishlist') && image ? (
          <div className="flex-shrink-0 mr-3 h-12 w-12 rounded overflow-hidden bg-white">
            <img 
              src={image} 
              alt="Product" 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=Product';
              }}
            />
          </div>
        ) : (
          <div className={`flex-shrink-0 mr-3 ${toastStyles.iconColor}`}>
            {toastStyles.icon}
          </div>
        )}
        
        <div className="flex-1 ml-1">
          {title && <h4 className="text-sm font-semibold">{title}</h4>}
          <div className="text-sm">{message}</div>
          {type === 'cart' && onActionClick && (
            <button 
              className="mt-2 text-xs underline hover:opacity-80 transition-opacity"
              onClick={handleActionClick}
            >
              View Cart
            </button>
          )}
          {type === 'wishlist' && onActionClick && (
            <button 
              className="mt-2 text-xs underline hover:opacity-80 transition-opacity"
              onClick={handleActionClick}
            >
              View Wishlist
            </button>
          )}
        </div>
        
        <button 
          onClick={handleClose}
          className={`ml-3 flex-shrink-0 ${toastStyles.iconColor} hover:opacity-75 transition-opacity`}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
 