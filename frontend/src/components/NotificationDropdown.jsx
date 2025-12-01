import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBell, FaCheckCircle, FaBox, FaShippingFast, FaTimesCircle, FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../store/notificationStore';
import SocketService from '../services/SocketService';

const NotificationDropdown = ({ onClearAll, onClearNotification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get notifications directly from the store
  const storeInstance = useNotificationStore();
  const { notifications, clearAll, removeNotification, debugInitialize, addNotification } = storeInstance;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Debug mounting and initialize
  useEffect(() => {
    console.log('[NotificationDropdown] MOUNTED');
    
    // Debug initialization
    try {
      const status = debugInitialize();
      console.log('[NotificationDropdown] Debug initialization status:', status);
    } catch (err) {
      console.error('[NotificationDropdown] Error in debug initialization:', err);
    }
    
    console.log('[NotificationDropdown] Store state:', storeInstance);
    console.log('[NotificationDropdown] Initial notifications:', notifications);
    
    // Set up socket listener for notifications if not already set up
    setupSocketListener();
    
    // Check if socket is connected
    const socket = SocketService.getSocket();
    console.log('[NotificationDropdown] Socket connection status:', socket?.connected ? 'Connected' : 'Disconnected');
    
    return () => {
      console.log('[NotificationDropdown] UNMOUNTED');
    };
  }, []);

  // Set up socket listener for notifications
  const setupSocketListener = () => {
    const socket = SocketService.getSocket();
    if (!socket) {
      console.error('[NotificationDropdown] No socket connection available - notifications will not work');
      return;
    }
    
    console.log('[NotificationDropdown] Setting up socket notification listener');
    
    // Debug socket connection events
    socket.on('connect', () => {
      console.log('[NotificationDropdown] Socket connected, ID:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.warn('[NotificationDropdown] Socket disconnected - notifications will not be received');
    });
    
    socket.on('connect_error', (error) => {
      console.error('[NotificationDropdown] Socket connection error:', error);
    });
    
    // Remove any existing listeners to prevent duplicates
    socket.off('status-notification');
    
    // Add listener for status notifications
    socket.on('status-notification', (notification) => {
      console.log('[NotificationDropdown] Received status notification via socket:', notification);
      
      try {
        // Create a notification object
        const newNotification = {
          id: `socket-notification-${Date.now()}`,
          title: notification.title || 'Order Status Update',
          message: notification.message || 'An order status has been updated',
          type: notification.type || 'order_status',
          timestamp: notification.timestamp || new Date().toISOString(),
          read: false,
          link: notification.link || '#',
          data: notification.orderData || null
        };
        
        console.log('[NotificationDropdown] Created notification object:', newNotification);
        
        // Add to the notification store
        addNotification(newNotification);
        console.log('[NotificationDropdown] Added socket notification to store');
        
        // Flash the bell icon or some visual indicator
        flashBell();
        
        // Force component update in case store update doesn't trigger rerender
        forceUpdate();
      } catch (err) {
        console.error('[NotificationDropdown] Error processing socket notification:', err);
      }
    });
    
    // Test socket connection by sending a ping
    if (socket.connected) {
      console.log('[NotificationDropdown] Socket already connected, ID:', socket.id);
    } else {
      console.log('[NotificationDropdown] Socket not connected, waiting for connection...');
    }
    
    console.log('[NotificationDropdown] Socket notification listener set up');
  };

  // Helper function to force component update
  const [, updateState] = useState({});
  const forceUpdate = () => updateState({});

  // Visual feedback when notification arrives
  const [isFlashing, setIsFlashing] = useState(false);
  const flashBell = () => {
    setIsFlashing(true);
    console.log('[NotificationDropdown] Bell flashing started');
    setTimeout(() => {
      setIsFlashing(false);
      console.log('[NotificationDropdown] Bell flashing stopped');
    }, 1000);
  };

  // Log notifications for debugging
  useEffect(() => {
    console.log('[NotificationDropdown] Notifications updated, count:', notifications.length);
    console.log('[NotificationDropdown] Unread count:', unreadCount);
    
    if (notifications.length > 0) {
      console.log('[NotificationDropdown] First notification:', notifications[0]);
      console.log('[NotificationDropdown] All notifications:', notifications);
    }
  }, [notifications, unreadCount]);

  // Listen for notification-received events from DOM
  useEffect(() => {
    const handleNotificationReceived = (event) => {
      if (event.detail && event.detail.notification) {
        const { notification } = event.detail;
        console.log('[NotificationDropdown] Received notification-received DOM event:', notification);
        
        try {
          // Add to the notification store directly
          addNotification(notification);
          console.log('[NotificationDropdown] Added notification from DOM event');
          
          // Flash the bell icon
          flashBell();
          
          // Force update to ensure rendering
          forceUpdate();
        } catch (err) {
          console.error('[NotificationDropdown] Error handling DOM notification event:', err);
        }
      }
    };
    
    document.addEventListener('notification-received', handleNotificationReceived);
    console.log('[NotificationDropdown] Added DOM event listener for notification-received');
    
    return () => {
      document.removeEventListener('notification-received', handleNotificationReceived);
      console.log('[NotificationDropdown] Removed DOM event listener for notification-received');
    };
  }, []);

  // Listen for order-status-updated events from DOM
  useEffect(() => {
    const handleOrderStatusUpdated = (event) => {
      if (event.detail && event.detail.order) {
        const { order } = event.detail;
        console.log('[NotificationDropdown] Received order-status-updated DOM event:', order);
        flashBell();
      }
    };
    
    window.addEventListener('order-status-updated', handleOrderStatusUpdated);
    console.log('[NotificationDropdown] Added DOM event listener for order-status-updated');
    
    return () => {
      window.removeEventListener('order-status-updated', handleOrderStatusUpdated);
      console.log('[NotificationDropdown] Removed DOM event listener for order-status-updated');
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get appropriate icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_delivered':
        return <FaCheckCircle className="text-green-500 text-lg" />;
      case 'order_processing':
        return <FaBox className="text-blue-500 text-lg" />;
      case 'order_shipped':
        return <FaShippingFast className="text-purple-500 text-lg" />;
      case 'order_cancelled':
        return <FaTimesCircle className="text-red-500 text-lg" />;
      default:
        return <FaBell className="text-gray-500 text-lg" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      console.error('[NotificationDropdown] Error formatting date:', e);
      return 'recently';
    }
  };

  const handleToggleDropdown = () => {
    console.log('[NotificationDropdown] Toggling dropdown, was:', isOpen);
    console.log('[NotificationDropdown] Current notifications count:', notifications.length);
    setIsOpen(!isOpen);
  };

  const handleClearAll = () => {
    console.log('[NotificationDropdown] Clearing all notifications');
    clearAll();
    if (onClearAll) onClearAll();
    setIsOpen(false);
  };

  const handleClearNotification = (id) => {
    console.log('[NotificationDropdown] Clearing notification:', id);
    removeNotification(id);
    if (onClearNotification) onClearNotification(id);
  };

  // Test notification function
  const testNotification = () => {
    console.log('[NotificationDropdown] Creating test notification');
    
    // Create a test notification
    const testNotif = {
      id: `test-notification-${Date.now()}`,
      title: 'Test Notification',
      message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
      type: 'order_status',
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        orderId: 'test-order',
        orderNumber: 'TEST-123',
        status: 'Processing'
      },
      link: '#'
    };
    
    // Add to store
    console.log('[NotificationDropdown] Adding test notification to store');
    addNotification(testNotif);
    
    // Flash bell
    flashBell();
    
    // Force update
    forceUpdate();
    
    return testNotif;
  };

  const handleNotificationClick = (notification) => {
    console.log('[NotificationDropdown] Notification clicked:', notification.id);
    setIsOpen(false);
  };
  
  console.log('[NotificationDropdown] Rendering with notification count:', notifications.length);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <div className="flex items-center">
        {/* Notification Bell */}
        <button
          onClick={handleToggleDropdown}
          className={`relative p-2 rounded-full transition-all focus:outline-none
            ${isFlashing ? 'animate-pulse bg-blue-100' : 'hover:bg-gray-100'}`}
          aria-label="Notifications"
        >
          <FaBell className={`text-xl ${isFlashing ? 'text-blue-600' : 'text-gray-700'}`} />
          
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
          </div>
          )}
        </button>
        
        {/* Debug button - only visible in development */}
        {/* {process.env.NODE_ENV !== 'production' && (
          <button
            onClick={testNotification}
            className="ml-2 p-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
            title="Create test notification"
          >
            Test
          </button>
        )} */}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200"
            style={{ maxHeight: '500px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">Notifications ({notifications.length})</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 px-4 text-center text-gray-500">
                  <div className="inline-block p-3 rounded-full bg-gray-100 mb-3">
                    <FaBell className="text-gray-400 text-xl" />
                  </div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {notifications.map((notification) => {
                    console.log('[NotificationDropdown] Rendering notification:', notification.id);
                    return (
                    <li 
                      key={notification.id} 
                      className={`relative hover:bg-gray-50 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                    >
                      <Link 
                        to={notification.link || '#'} 
                        className="block px-4 py-3"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-800' : 'text-black'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </Link>
                      
                      {/* Close button */}
                      <button 
                        onClick={() => handleClearNotification(notification.id)}
                        className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        aria-label="Remove notification"
                      >
                        <FaTimes size={12} />
                      </button>
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown; 