import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { useOrderStore } from './orderStore';

// Map order status to notification type
const mapOrderStatusToNotificationType = (status) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'order_delivered';
    case 'processing':
      return 'order_processing';
    case 'shipped':
      return 'order_shipped';
    case 'cancelled':
      return 'order_cancelled';
    default:
      return 'order_status';
  }
};

// Format the notification message based on order status
const getOrderStatusMessage = (status, orderNumber) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return `Your order #${orderNumber} has been delivered! Thank you for shopping with us.`;
    case 'processing':
      return `Your order #${orderNumber} is now being processed and prepared for shipping.`;
    case 'shipped':
      return `Great news! Your order #${orderNumber} has been shipped and is on its way.`;
    case 'cancelled':
      return `Your order #${orderNumber} has been cancelled. Please contact customer support for more information.`;
    default:
      return `The status of your order #${orderNumber} has been updated to ${status}.`;
  }
};

// Create the notification store
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      isInitialized: false,
      
      // Debug initialization (called from components to ensure store is ready)
      debugInitialize: () => {
        console.log('[NotificationStore] DEBUG INITIALIZATION CALLED');
        console.log('[NotificationStore] Current state:', get());
        
        // Force rehydration if needed
        const currentNotifications = get().notifications || [];
        console.log('[NotificationStore] Current notifications count:', currentNotifications.length);
        
        // Return status
        return {
          isInitialized: get().isInitialized,
          notificationCount: currentNotifications.length
        };
      },
      
      // Add a test notification (for debugging)
      addTestNotification: () => {
        console.log('[NotificationStore] Adding test notification');
        
        // Create a distinct test notification
        const testNotification = {
          id: `test-${Date.now()}`,
          title: '🔔 Test Notification',
          message: `This is a test notification created at ${new Date().toLocaleTimeString()}.`,
          type: 'test',
          read: false,
          timestamp: new Date().toISOString(),
        };
        
        // For tests, we'll use direct state updates to ensure it's working
        set(state => {
          const updatedNotifications = [testNotification, ...state.notifications];
          console.log('[NotificationStore] Directly updated notifications:', updatedNotifications.length);
          return { notifications: updatedNotifications };
        });
        
        // Try to trigger browser notification too
        try {
          if (Notification && Notification.permission === 'granted' && !document.hasFocus()) {
            new Notification(testNotification.title, {
              body: testNotification.message,
              icon: '/logo.png'
            });
          }
        } catch (err) {
          console.error('[NotificationStore] Error showing browser notification:', err);
        }
        
        return testNotification;
      },
      
      // Add a new notification
      addNotification: (notification) => {
        console.log('[NotificationStore] Adding new notification:', notification);
        
        // Ensure we have all required fields
        if (!notification || !notification.title || !notification.message) {
          console.error('[NotificationStore] Invalid notification data:', notification);
          return null;
        }
        
        const newNotification = {
          id: notification.id || uuidv4(),
          title: notification.title,
          message: notification.message,
          type: notification.type || 'default',
          read: false,
          link: notification.link || null,
          timestamp: notification.timestamp || new Date().toISOString(),
          data: notification.data || null
        };
        
        set((state) => {
          console.log('[NotificationStore] Current notifications count:', state.notifications.length);
          const newNotifications = [newNotification, ...state.notifications];
          console.log('[NotificationStore] New notifications count:', newNotifications.length);
          
          // Play sound if notification service is available
          try {
            if (window.notificationService) {
              console.log('[NotificationStore] Playing notification sound');
              window.notificationService.playMessageSound();
            }
          } catch (err) {
            console.error('[NotificationStore] Error playing notification sound:', err);
          }
          
          return { notifications: newNotifications };
        });
        
        // Try to show browser notification
        try {
          if (Notification && Notification.permission === 'granted' && !document.hasFocus()) {
            console.log('[NotificationStore] Showing browser notification');
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo.png'
            });
          }
        } catch (err) {
          console.error('[NotificationStore] Error showing browser notification:', err);
        }
        
        return newNotification;
      },
      
      // Add a notification for an order status update
      addOrderStatusNotification: (order) => {
        console.log('[NotificationStore] Adding order status notification for order:', order);
        
        if (!order || !order.status || !order.orderNumber) {
          console.error('[NotificationStore] Invalid order data for notification:', order);
          return null;
        }
        
        const notificationType = mapOrderStatusToNotificationType(order.status);
        const message = getOrderStatusMessage(order.status, order.orderNumber);
        
        console.log(`[NotificationStore] Created notification type: ${notificationType}, message: ${message}`);
        
        const notification = {
          id: `order-${order._id}-${order.status}-${Date.now()}`,
          title: `Order ${order.status}`,
          message,
          type: notificationType,
          link: `/profile?tab=orders&order=${order._id}`,
          data: { orderId: order._id },
          timestamp: new Date().toISOString(),
        };
        
        return get().addNotification(notification);
      },
      
      // Mark notification as read
      markAsRead: (notificationId) => {
        console.log('[NotificationStore] Marking notification as read:', notificationId);
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification
          )
        }));
      },
      
      // Mark all notifications as read
      markAllAsRead: () => {
        console.log('[NotificationStore] Marking all notifications as read');
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true
          }))
        }));
      },
      
      // Remove a notification
      removeNotification: (notificationId) => {
        console.log('[NotificationStore] Removing notification:', notificationId);
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== notificationId
          )
        }));
      },
      
      // Clear all notifications
      clearAll: () => {
        console.log('[NotificationStore] Clearing all notifications');
        set({ notifications: [] });
      },
      
      // Get unread notification count
      getUnreadCount: () => {
        const count = get().notifications.filter(n => !n.read).length;
        console.log('[NotificationStore] Unread notification count:', count);
        return count;
      },
      
      // Set initialized flag
      setInitialized: (value) => {
        console.log('[NotificationStore] Setting initialized flag to:', value);
        set({ isInitialized: value });
      },
      
      // Initialize event listeners for order updates
      initOrderUpdateListeners: () => {
        console.log('[NotificationStore] Initializing order update listeners');
        
        if (get().isInitialized) {
          console.log('[NotificationStore] Already initialized, skipping');
          return () => {};
        }
        
        // Need to access this outside the hook context
        const orderStore = useOrderStore.getState();
        
        if (!orderStore || !orderStore.subscribeToOrderUpdates) {
          console.error('[NotificationStore] OrderStore not available or missing subscribeToOrderUpdates method');
          return () => {};
        }
        
        // Subscribe to order updates
        const unsubscribe = orderStore.subscribeToOrderUpdates((updatedOrder) => {
          console.log('[NotificationStore] Received order update:', updatedOrder);
          
          if (updatedOrder && updatedOrder.status) {
            console.log('[NotificationStore] Processing order update for status:', updatedOrder.status);
            
            // Check if we already have a notification for this status
            const existingNotif = get().notifications.find(n => 
              n.data?.orderId === updatedOrder._id && 
              n.type === mapOrderStatusToNotificationType(updatedOrder.status)
            );
            
            if (existingNotif) {
              console.log('[NotificationStore] Notification already exists for this order status, skipping');
            } else {
              console.log('[NotificationStore] Creating new notification for order status update');
              get().addOrderStatusNotification(updatedOrder);
            }
          } else {
            console.warn('[NotificationStore] Received invalid order update');
          }
        });
        
        console.log('[NotificationStore] Order update listener initialized');
        get().setInitialized(true);
        
        // Return unsubscribe function
        return unsubscribe;
      }
    }),
    {
      name: 'sinosply-notifications',
      partialize: (state) => ({ 
        notifications: state.notifications.slice(0, 50), // Keep only the 50 most recent notifications
        isInitialized: state.isInitialized
      }),
      // Important: Add a version for migrations
      version: 1,
      // Force using localStorage even in incognito mode
      storage: {
        getItem: (name) => {
          console.log('[NotificationStore] Reading from storage:', name);
          const data = localStorage.getItem(name);
          console.log('[NotificationStore] Storage data found:', !!data);
          
          // Log the stored notifications if any
          if (data) {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData && parsedData.state && parsedData.state.notifications) {
                console.log('[NotificationStore] Retrieved notifications count:', parsedData.state.notifications.length);
                console.log('[NotificationStore] First notification:', 
                  parsedData.state.notifications.length > 0 ? parsedData.state.notifications[0] : 'none');
              } else {
                console.log('[NotificationStore] No notifications found in storage data');
              }
            } catch (err) {
              console.error('[NotificationStore] Error parsing storage data:', err);
            }
          }
          
          return data;
        },
        setItem: (name, value) => {
          console.log('[NotificationStore] Writing to storage:', name);
          try {
            localStorage.setItem(name, value);
            console.log('[NotificationStore] Storage write successful');
          } catch (err) {
            console.error('[NotificationStore] Storage write failed:', err);
          }
        },
        removeItem: (name) => {
          console.log('[NotificationStore] Removing from storage:', name);
          localStorage.removeItem(name);
        }
      }
    }
  )
); 