import { io } from 'socket.io-client';
import apiConfig from '../config/apiConfig';
import { useOrderStore } from '../store/orderStore';
import { useNotificationStore } from '../store/notificationStore';

// Singleton pattern for socket connection
let socket = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize the socket connection
 * @param {string} userId - The user ID for authentication 
 * @returns {Object} The socket connection object
 */
const initializeSocket = (userId) => {
  if (socket && isConnected) {
    console.log('🔌 Socket already connected, reusing connection');
    return socket;
  }
  
  try {
    // Extract the base URL without the API path
    const baseUrl = apiConfig.baseURL.replace('/api/v1', '');
    console.log('🔌 Initializing socket connection to:', baseUrl);
    console.log('🔧 [DEBUG] Connection parameters: userID:', userId);
    
    // Create socket connection with auth params
    socket = io(baseUrl, {
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: {
        userId,
        userType: 'admin',
        sessionId: `admin-${userId}-${Date.now()}`
      }
    });
    
    // Log socket object state
    console.log('🔧 [DEBUG] Socket created with ID:', socket ? socket.id : 'undefined');
    console.log('🔧 [DEBUG] Socket connected status:', socket ? socket.connected : 'N/A');
    
    // Add connection event handlers
    socket.on('connect', () => {
      console.log('🔌 Socket connected!', socket.id);
      isConnected = true;
      reconnectAttempts = 0;
      
      // Register as admin
      socket.emit('register-admin', userId);
      console.log('🔧 [DEBUG] Sent register-admin event with userID:', userId);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      isConnected = false;
    });
    
    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
      console.error('🔧 [DEBUG] Connection error details:', error);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('🔌 Max reconnection attempts reached, giving up');
        socket.disconnect();
      }
    });
    
    // Add more debug listeners
    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 [DEBUG] Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
    });
    
    socket.io.on('reconnect', (attempt) => {
      console.log(`✅ [DEBUG] Reconnected on attempt ${attempt}`);
    });
    
    socket.io.on('reconnect_error', (error) => {
      console.error('❌ [DEBUG] Reconnection error:', error);
    });
    
    socket.io.on('reconnect_failed', () => {
      console.error('❌ [DEBUG] Failed to reconnect after all attempts');
    });

    // Set up notification listener automatically
    setupNotificationListener();
    
    return socket;
  } catch (error) {
    console.error('🔌 Socket initialization error:', error);
    return null;
  }
};

/**
 * Set up listener for status notifications
 */
const setupNotificationListener = () => {
  if (!socket) {
    console.warn('🔌 Socket not initialized, cannot setup notification listener');
    return;
  }

  // Remove existing listeners to avoid duplicate notifications
  socket.off('status-notification');

  // Listen for status-notification events
  socket.on('status-notification', (data) => {
    console.log('🔔 Status notification received:', data);
    
    // Get notification store and add notification
    try {
      // Access store directly instead of using hooks
      const notificationStore = useNotificationStore.getState();
      
      console.log('🔧 [DEBUG] Notification store accessed:', !!notificationStore);
      console.log('🔧 [DEBUG] Add notification function available:', !!notificationStore?.addNotification);
      
      if (notificationStore && notificationStore.addNotification) {
        const notification = {
          id: `socket-status-${Date.now()}`,
          title: data.title || 'Order Status Update',
          message: data.message || 'An order status has been updated',
          type: data.type || 'order_status',
          timestamp: data.timestamp || new Date().toISOString(),
          data: data.orderData || null,
          link: data.link || '#',
          read: false
        };
        
        console.log('🔧 [DEBUG] Created notification object:', notification);
        
        // Add notification to store
        const result = notificationStore.addNotification(notification);
        console.log('✅ Notification added to store, result:', result);
        
        // Try to display a browser notification if supported
        try {
          if (Notification && Notification.permission === 'granted' && !document.hasFocus()) {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo.png'
            });
            console.log('✅ Browser notification displayed');
          }
        } catch (err) {
          console.error('❌ Error displaying browser notification:', err);
        }
        
        // Dispatch DOM event for components that might be listening
        try {
          const event = new CustomEvent('notification-received', { 
            detail: { notification } 
          });
          document.dispatchEvent(event);
          console.log('✅ Dispatched notification-received event to DOM');
        } catch (err) {
          console.error('❌ Error dispatching notification event:', err);
        }
      } else {
        console.error('❌ Notification store or addNotification method not available');
      }
    } catch (error) {
      console.error('❌ Error handling notification:', error);
    }
  });

  console.log('🔔 Status notification listener set up');
};

/**
 * Listen for new orders and updates
 * @param {Function} onNewOrder - Callback for new orders
 * @param {Function} onOrderUpdate - Callback for order updates
 */
const listenForOrders = (onNewOrder, onOrderUpdate) => {
  if (!socket) {
    console.warn('🔌 Socket not initialized, cannot listen for orders');
    return;
  }
  
  // Remove any existing listeners to prevent duplicates
  socket.off('new-order');
  socket.off('order-updated');
  
  // Add new order listener
  socket.on('new-order', ({ order }) => {
    console.log('📦 New order received via socket:', order?.orderNumber || order?._id);
    console.log('🔧 [DEBUG] Received order object:', order ? JSON.stringify(order).substring(0, 100) + '...' : 'undefined');
    
    // Pass the order to the callback
    if (onNewOrder && typeof onNewOrder === 'function') {
      onNewOrder(order);
    } else {
      console.warn('🔧 [DEBUG] onNewOrder callback is not a function:', onNewOrder);
    }
    
    // Also update the store automatically
    try {
      const orderStore = useOrderStore.getState();
      if (orderStore && orderStore.addOrder) {
        orderStore.addOrder(order);
        console.log('✅ Order automatically added to store');
      } else {
        console.warn('🔧 [DEBUG] orderStore or addOrder method not found in store');
      }
    } catch (error) {
      console.error('❌ Error updating order store:', error);
    }
  });
  
  // Add order update listener
  socket.on('order-updated', ({ order }) => {
    console.log('📝 Order update received via socket:', order?.orderNumber || order?._id);
    console.log('🔧 [DEBUG] Updated order object:', order ? JSON.stringify(order).substring(0, 100) + '...' : 'undefined');
    
    // Pass the updated order to the callback
    if (onOrderUpdate && typeof onOrderUpdate === 'function') {
      onOrderUpdate(order);
    } else {
      console.warn('🔧 [DEBUG] onOrderUpdate callback is not a function:', onOrderUpdate);
    }
    
    // Also update the store automatically
    try {
      const orderStore = useOrderStore.getState();
      if (orderStore && orderStore.updateOrder) {
        orderStore.updateOrder(order._id, order);
        console.log('✅ Order automatically updated in store');
      } else {
        console.warn('🔧 [DEBUG] orderStore or updateOrder method not found in store');
      }
    } catch (error) {
      console.error('❌ Error updating order store:', error);
    }
  });
  
  // Confirm listeners are set up
  console.log('🔧 [DEBUG] Order listeners registered. Socket ready state:', 
    socket.connected ? 'connected' : 'disconnected');
};

/**
 * Emit an order status change event
 * @param {Object} order - The updated order
 * @param {String} previousStatus - The previous status
 */
const emitOrderStatusChange = (order, previousStatus) => {
  if (!socket || !isConnected) {
    console.warn('🔌 Socket not connected, cannot emit order status change');
    return false;
  }

  try {
    console.log('📤 Emitting order status change:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      prevStatus: previousStatus,
      newStatus: order.status
    });

    // Emit order-updated event
    socket.emit('order-updated', { order });

    // Also emit a dedicated status change event
    socket.emit('status-change', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: order.status,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Order status change emitted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error emitting order status change:', error);
    return false;
  }
};

/**
 * Disconnect the socket
 */
const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('🔌 Socket disconnected manually');
  }
};

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
const isSocketConnected = () => {
  return isConnected && socket?.connected;
};

// Export all socket functions
const SocketService = {
  initializeSocket,
  listenForOrders,
  disconnectSocket,
  isSocketConnected,
  getSocket: () => socket,
  emitOrderStatusChange,
  setupNotificationListener
};

export default SocketService;