import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import apiConfig from '../config/apiConfig.js';

// Add detailed logging to the order update notification system
const orderUpdateListeners = new Set();

// Function to notify all listeners about order updates
const notifyOrderUpdate = (updatedOrder) => {
  console.log(`[OrderStore] Notifying ${orderUpdateListeners.size} listeners about order update:`, updatedOrder.orderNumber, updatedOrder.status);
  
  if (orderUpdateListeners.size === 0) {
    console.warn('[OrderStore] No listeners registered for order updates');
  }
  
  orderUpdateListeners.forEach(listener => {
    try {
      console.log('[OrderStore] Calling listener with updated order');
      listener(updatedOrder);
    } catch (err) {
      console.error('[OrderStore] Error in order update listener:', err);
    }
  });
};

// Helper function to calculate approximate size of an object in bytes
const getApproximateSize = (obj) => {
  return JSON.stringify(obj).length * 2; // Rough estimate: 2 bytes per character
};

// Helper function to truncate large fields in objects
const optimizeOrderForStorage = (order) => {
  if (!order) return order;
  
  // Create a copy to avoid mutating the original
  const optimized = {...order};
  
  // Truncate or remove large image data if present
  if (optimized.paymentReceipt && optimized.paymentReceipt.imageData) {
    // If the image data is very large (>100KB), don't store it in localStorage
    if (optimized.paymentReceipt.imageData.length > 100000) {
      // Keep a reference that there was image data but don't store the actual data
      optimized.paymentReceipt = {
        ...optimized.paymentReceipt,
        imageData: '[IMAGE_DATA_REMOVED_FOR_STORAGE]',
        _imageTruncated: true
      };
    }
  }
  
  // Truncate product images in items if they're data URLs
  if (Array.isArray(optimized.items)) {
    optimized.items = optimized.items.map(item => {
      if (item.image && item.image.startsWith('data:') && item.image.length > 10000) {
        return {
          ...item,
          image: item.image.substring(0, 100) + '...[truncated]', 
          _imageTruncated: true
        };
      }
      return item;
    });
  }
  
  return optimized;
};

// Maximum number of orders to store in localStorage
const MAX_STORED_ORDERS = 100;

// Track order loading status to prevent duplicate loads
let isOrderLoadInProgress = false;

export const useOrderStore = create(
  persist(
    (set, get) => ({
      orderInfo: null,
      paymentStatus: null,
      trackingInfo: null,
      orders: [], // Store user orders
      selectedOrder: null, // Track the currently selected order for view/edit
      isLoading: false, // Add loading indicator
      lastFetchTime: null, // Track when data was last fetched
      
      // New method to clean up storage
      cleanupOrderStorage: () => {
        try {
          const orders = get().orders;
          console.log(`[OrderStore] Running storage cleanup. Current orders: ${orders.length}`);
          
          if (orders.length <= MAX_STORED_ORDERS) {
            console.log('[OrderStore] Order count within limit, no cleanup needed');
            return;
          }
          
          // Sort by date (most recent first)
          const sortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.createdAt || 0);
            return dateB - dateA;
          });
          
          // Keep only the most recent MAX_STORED_ORDERS
          const trimmedOrders = sortedOrders.slice(0, MAX_STORED_ORDERS);
          console.log(`[OrderStore] Trimmed orders from ${orders.length} to ${trimmedOrders.length}`);
          
          set({ orders: trimmedOrders });
          return trimmedOrders;
        } catch (error) {
          console.error('[OrderStore] Error during storage cleanup:', error);
        }
      },
      
      // Emergency cleanup function to handle storage quota errors
      cleanupOrderStorage: () => {
        try {
          const orders = get().orders;
          console.log('[OrderStore] Running emergency cleanup due to storage quota error');
          
          // Only keep the 20 most recent orders
          const MAX_EMERGENCY_ORDERS = 20;
          
          // Sort by date (newest first)
          const sortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.createdAt || 0);
            return dateB - dateA;
          });
          
          // Keep only the most recent MAX_EMERGENCY_ORDERS
          const trimmedOrders = sortedOrders.slice(0, MAX_EMERGENCY_ORDERS);
          console.log(`[OrderStore] Emergency cleanup: trimmed orders from ${orders.length} to ${trimmedOrders.length}`);
          
          // For each order, also remove any large data
          const optimizedOrders = trimmedOrders.map(order => {
            const optimized = {...order};
            
            // Remove large payment receipt images
            if (optimized.paymentReceipt && optimized.paymentReceipt.imageData 
                && optimized.paymentReceipt.imageData.length > 1000) {
              optimized.paymentReceipt = {
                ...optimized.paymentReceipt,
                imageData: null,
                _imageTruncated: true
              };
            }
            
            // Truncate any large data URLs in product images
            if (Array.isArray(optimized.items)) {
              optimized.items = optimized.items.map(item => {
                if (item.image && typeof item.image === 'string' && item.image.length > 1000) {
                  return {...item, image: null};
                }
                return item;
              });
            }
            
            return optimized;
          });
          
          // Update the store with cleaned data
          set({ orders: optimizedOrders });
          return optimizedOrders;
        } catch (error) {
          console.error('[OrderStore] Error during storage cleanup:', error);
          return [];
        }
      },
      
      // New methods for update notification
      subscribeToOrderUpdates: (callback) => {
        if (typeof callback !== 'function') {
          console.error('[OrderStore] Attempted to subscribe with invalid callback:', callback);
          return () => {}; // Return no-op unsubscribe
        }
        
        console.log('[OrderStore] Adding new order update listener');
        orderUpdateListeners.add(callback);
        console.log(`[OrderStore] Current listener count: ${orderUpdateListeners.size}`);
        
        // Return unsubscribe function
        return () => {
          console.log('[OrderStore] Removing order update listener');
          orderUpdateListeners.delete(callback);
          console.log(`[OrderStore] Remaining listener count: ${orderUpdateListeners.size}`);
        };
      },
      
      // Fast preload function specifically for admin dashboard
      preloadOrders: async () => {
        // Skip if already loading
        if (isOrderLoadInProgress) {
          console.log('[OrderStore] Order preload skipped - already in progress');
          return { success: false, message: 'Already loading' };
        }
        
        try {
          isOrderLoadInProgress = true;
          set({ isLoading: true });
          
          // Get token from localStorage
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('[OrderStore] No token found, cannot preload orders');
            set({ isLoading: false });
            return { success: false, error: 'Authentication required' };
          }
          
          console.log('[OrderStore] Fast preloading all orders for dashboard...');
          
          // Create a fast-path for admin dashboard by just requesting most recent 50 orders
          // This is much faster than fetching all pages
          const response = await axios.get(`${apiConfig.baseURL}/orders`, {
            params: { page: 1, limit: 50 }, // Just fetch recent orders for dashboard stats
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            console.log(`[OrderStore] Successfully preloaded ${response.data.data.length} recent orders`);
            
            // Update store with fetched orders
            set({ 
              orders: response.data.data,
              lastFetchTime: Date.now(),
              isLoading: false 
            });
            
            return { success: true, data: response.data.data };
          } else {
            throw new Error('Failed to preload orders');
          }
        } catch (error) {
          console.error('[OrderStore] Error preloading orders:', error);
          set({ isLoading: false });
          return { success: false, error: error.message };
        } finally {
          isOrderLoadInProgress = false;
        }
      },
      
      // Fetch all orders from the API - updated to handle cleanup
      fetchOrders: async (forceRefresh = false) => {
        // Skip if already loading
        if (isOrderLoadInProgress) {
          console.log('[OrderStore] Order fetch skipped - already in progress');
          return { success: false, message: 'Already loading' };
        }
        
        try {
          // Check if we already have cached data and if it's fresh enough
          const cachedOrders = get().orders;
          const lastFetch = get().lastFetchTime;
          
          if (!forceRefresh && cachedOrders.length > 0 && lastFetch && (Date.now() - lastFetch < 5 * 60 * 1000)) {
            console.log('[OrderStore] Using cached orders data');
            return { success: true, data: cachedOrders };
          }
          
          // If we get here, we need to fetch fresh data
          isOrderLoadInProgress = true;
          set({ isLoading: true });
          
          // Get token from localStorage
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('No token found, cannot fetch orders');
            set({ isLoading: false });
            return { success: false, error: 'Authentication required' };
          }
          
          console.log('Fetching all orders from API...');
          
          // Modified: Directly fetch a reasonable number of orders
          // to avoid hitting storage limits
          const response = await axios.get(`${apiConfig.baseURL}/orders`, {
            params: { page: 1, limit: MAX_STORED_ORDERS }, // Limit to prevent localStorage issues
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            console.log(`[OrderStore] Successfully fetched ${response.data.data.length} orders`);
            
            // Update store with fetched orders
          set({ 
              orders: response.data.data,
            lastFetchTime: Date.now(),
            isLoading: false 
          });
          
            return { success: true, data: response.data.data };
          } else {
            throw new Error('Failed to fetch orders');
          }
        } catch (error) {
          console.error('[OrderStore] Error fetching orders:', error);
          set({ isLoading: false });
          return { success: false, error: error.message };
        } finally {
          isOrderLoadInProgress = false;
        }
      },
      
      setOrderInfo: (orderInfo) => {
        // Create a tracking number if not provided
        const orderWithTracking = {
          ...orderInfo,
          trackingNumber: orderInfo.trackingNumber || `TRK${Math.floor(Math.random() * 10000000000)}`,
          // Ensure order data has the required formats for display
          items: Array.isArray(orderInfo.products) 
            ? orderInfo.products.map(p => ({
                id: p.id || `PROD-${Math.random().toString(36).substr(2, 9)}`,
                name: p.name,
                price: p.price,
                quantity: p.quantity,
                image: p.image,
                variant: p.variant || { color: p.colorName, size: p.size }
              }))
            : []
        };
        
        set({ orderInfo: orderWithTracking });
      },
      
      clearOrderInfo: () => set({ orderInfo: null }),
      
      setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
      
      clearPaymentStatus: () => set({ paymentStatus: null }),
      
      setTrackingInfo: (trackingInfo) => set({ trackingInfo }),
      
      clearTrackingInfo: () => set({ trackingInfo: null }),
      
      // Formats the shipping address in the expected format for tracking
      getFormattedShippingAddress: () => {
        const { orderInfo } = get();
        if (!orderInfo || !orderInfo.shippingAddress) return null;
        
        const { shippingAddress, contactInfo } = orderInfo;
        
        return {
          name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Customer',
          street: shippingAddress.address1 || '',
          addressLine2: shippingAddress.address2 || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          zip: shippingAddress.zip || shippingAddress.zipCode || '',
          country: shippingAddress.country || '',
          phone: contactInfo?.phone || ''
        };
      },

      // New functions for orders
      setOrders: (orders) => set({ orders }),
      
      // Add order function - updated to check size and optimize
      addOrder: (order) => {
        const orders = get().orders;
        // Check if order already exists
        const exists = orders.some(o => o._id === order._id || o.orderNumber === order.orderNumber);
        
        // Ensure the order has correct user ID fields
        const orderWithUser = { ...order };
        
        // If either userId or user is set, ensure both are set consistently
        if (orderWithUser.userId && !orderWithUser.user) {
          orderWithUser.user = orderWithUser.userId;
        } else if (orderWithUser.user && !orderWithUser.userId) {
          orderWithUser.userId = orderWithUser.user;
        }
        
        console.log('OrderStore - Adding order:', { 
          order: orderWithUser, 
          exists, 
          currentOrdersCount: orders.length 
        });
        
        if (!exists) {
          // Optimize the order for storage
          const optimizedOrder = optimizeOrderForStorage(orderWithUser);
          
          // Check if we need to cleanup before adding
          if (orders.length >= MAX_STORED_ORDERS) {
            console.log(`[OrderStore] Orders limit reached (${orders.length}/${MAX_STORED_ORDERS}), cleaning up before adding new order`);
            const cleanedOrders = [...get().cleanupOrderStorage()];
            set({ orders: [optimizedOrder, ...cleanedOrders] });
          } else {
            set({ orders: [optimizedOrder, ...orders] });
          }
          
          console.log('OrderStore - Order added, new count:', get().orders.length);
        } else {
          console.log('OrderStore - Order already exists, not adding');
        }
      },
      
      getOrders: () => {
        const orders = get().orders;
        console.log('OrderStore - Getting all orders:', { 
          count: orders.length,
          orders
        });
        return orders;
      },
      
      // Get orders for a specific user
      getUserOrders: (userId, userEmail) => {
        if (!userId && !userEmail) return [];
        
        const orders = get().orders;
        return orders.filter(order => {
          return (
            (userId && order.userId === userId) ||
            (userId && order.user === userId) ||
            (userEmail && order.customerEmail === userEmail)
          );
        });
      },

      // Ensure all orders have consistent user ID fields
      fixOrderUserIds: () => {
        const orders = get().orders;
        console.log('OrderStore - Fixing order user IDs for consistency');
        
        let hasChanges = false;
        const fixedOrders = orders.map(order => {
          const updatedOrder = { ...order };
          let updated = false;
          
          // If userId exists but user doesn't, copy userId to user
          if (updatedOrder.userId && !updatedOrder.user) {
            console.log(`OrderStore - Setting user field for order ${updatedOrder.orderNumber || updatedOrder._id}`);
            updatedOrder.user = updatedOrder.userId;
            updated = true;
          }
          // If user exists but userId doesn't, copy user to userId
          else if (updatedOrder.user && !updatedOrder.userId) {
            console.log(`OrderStore - Setting userId field for order ${updatedOrder.orderNumber || updatedOrder._id}`);
            updatedOrder.userId = updatedOrder.user;
            updated = true;
          }
          
          hasChanges = hasChanges || updated;
          return updatedOrder;
        });
        
        // Only update state if changes were made
        if (hasChanges) {
          set({ orders: fixedOrders });
          console.log('OrderStore - Fixed order IDs, count:', fixedOrders.length);
        } else {
          console.log('OrderStore - No fixes needed for order IDs');
        }
        
        return fixedOrders;
      },
      
      clearOrders: () => {
        console.log('OrderStore - Clearing all orders');
        set({ orders: [] });
      },

      // Initialize with sample order data
      initializeWithSampleOrder: (userId = null, userEmail = null) => {
        console.log('OrderStore - Initializing with sample order for user:', { userId, userEmail });
        const sampleOrder = {
          _id: "sample-" + Date.now(),
          orderNumber: "ORD-" + Math.floor(10000 + Math.random() * 90000),
          userId: userId || "6785e68c70b5db143ffb765a",
          user: userId || "6785e68c70b5db143ffb765a",
          items: [
            {
              productId: "17",
              name: "RUBY MINI DRESS",
              price: 85,
              quantity: 1,
              image: "https://us.princesspolly.com/cdn/shop/files/1-modelinfo-natalya-us2_b42cca63-08ff-4834-8df0-6d0388fbd998.jpg?v=1737510316",
              sku: "",
              color: "",
              size: "",
              _id: "sample-item-" + Date.now()
            }
          ],
          shippingAddress: {
            name: "Customer",
            street: "123 Example Street",
            city: "TAMALE",
            state: "bbb",
            zip: "00233",
            country: "Ghana",
            phone: "233559182794"
          },
          billingAddress: {
            city: "TAMALE",
            state: "bbb",
            zip: "00233",
            country: "Ghana"
          },
          paymentMethod: "Mobile Money",
          paymentDetails: {
            transactionId: "REF-" + Date.now(),
            status: "completed",
            cardDetails: {
              brand: "Visa",
              last4: "4242"
            }
          },
          // Add sample payment receipt
          paymentReceipt: {
            type: 'link',
            imageData: '',
            link: 'https://pay.chippercash.com/api/pdfs/receipt?ref=SAMPLE-RECEIPT',
            uploadedAt: new Date().toISOString()
          },
          subtotal: 85,
          tax: 12.75,
          shipping: 15.99,
          discount: 8.5,
          totalAmount: 85,
          status: "Processing",
          trackingNumber: "RG" + Math.floor(100000 + Math.random() * 900000) + "DS",
          shippingMethod: "express",
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          receiptId: "RCP-" + Math.floor(100000 + Math.random() * 900000),
          customerEmail: userEmail || "customer@example.com",
          customerName: "Customer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log('OrderStore - Created sample order:', sampleOrder);
        set({ orders: [sampleOrder] });
        console.log('OrderStore - Store updated with sample order');
      },

      // New functions for selected order
      selectOrder: (orderId) => {
        const orders = get().orders;
        const order = orders.find(o => o._id === orderId);
        set({ selectedOrder: order || null });
      },
      
      clearSelectedOrder: () => set({ selectedOrder: null }),
      
      getSelectedOrder: () => get().selectedOrder,

      // Update order function - updated to optimize
      updateOrder: (orderId, updatedData) => {
        const orders = get().orders;
        
        // Helper function to handle deep merging of nested objects
        const deepMerge = (target, source) => {
          const output = {...target};
          
          if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
              if (isObject(source[key])) {
                if (!(key in target)) {
                  output[key] = source[key];
                } else {
                  output[key] = deepMerge(target[key], source[key]);
                }
              } else {
                output[key] = source[key];
              }
            });
          }
          
          return output;
        };
        
        // Check if value is an object
        function isObject(item) {
          return (item && typeof item === 'object' && !Array.isArray(item));
        }
        
        try {
        const updatedOrders = orders.map(order => {
          if (order._id === orderId) {
            // Create a deep merged version of the order
            const updatedOrder = deepMerge(order, updatedData);
            // Always update the timestamp
            updatedOrder.updatedAt = new Date().toISOString();
              
              // Optimize for storage before saving
              const optimizedOrder = optimizeOrderForStorage(updatedOrder);
            
            // Trigger notifications about this update
              notifyOrderUpdate(optimizedOrder);
            
              return optimizedOrder;
          }
          return order;
        });
        
        // Check if we need to update selectedOrder too
        const selectedOrder = get().selectedOrder;
        const updatedSelectedOrder = selectedOrder && selectedOrder._id === orderId 
          ? deepMerge(selectedOrder, {...updatedData, updatedAt: new Date().toISOString()}) 
          : selectedOrder;
        
        // Update the state
        set({ 
          orders: updatedOrders,
          selectedOrder: updatedSelectedOrder
        });
        
        return updatedOrders.find(order => order._id === orderId);
        } catch (error) {
          console.error('[OrderStore] Error updating order:', error);
          // Try to recover by running cleanup
          get().cleanupOrderStorage();
          throw error;
        }
      },

      // Convenience function to just update status - with storage quota handling
      updateOrderStatus: (orderId, newStatus) => {
        console.log(`[OrderStore] Updating order status for order ${orderId} to ${newStatus}`);
        
        try {
        // Update order in store
        const updatedOrder = get().updateOrder(orderId, { status: newStatus });
        if (!updatedOrder) {
          console.error(`[OrderStore] Failed to update order ${orderId} status to ${newStatus}`);
          return null;
        }
        
        console.log(`[OrderStore] Order ${orderId} status updated to ${newStatus} in store`);
        
        // Log notification count - for debugging
        console.log(`[OrderStore] Notifying subscribers about order status change`);
        
        // Try to update on server if possible - don't wait for response
        const syncToServer = async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              console.warn('[OrderStore] No auth token found, cannot sync to server');
              return false;
            }
            
            console.log(`[OrderStore] Syncing order status to server: ${orderId} -> ${newStatus}`);
            
            // Fix the URL to prevent double API path
            // We ensure we're using the correct path format by using URL constructor
            const baseUrlWithoutTrailingSlash = apiConfig.baseURL.replace(/\/$/, '');
            const orderStatusEndpoint = `${baseUrlWithoutTrailingSlash}/orders/${orderId}/status`;
            
            console.log(`[OrderStore] Using endpoint: ${orderStatusEndpoint}`);
            
            await axios.put(
              orderStatusEndpoint,
              { status: newStatus },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log(`[OrderStore] Order status synced to server successfully: ${orderId} -> ${newStatus}`);
            return true;
          } catch (error) {
            console.error('[OrderStore] Failed to sync order status to server:', error);
            return false;
          }
        };
        
        // Fire and forget - don't block UI
        syncToServer();
        
        return updatedOrder;
        } catch (error) {
          console.error(`[OrderStore] Error updating order status: ${error.message}`);
          
          // Check if this is a storage quota error
          if (error.message && error.message.includes('quota')) {
            console.warn('[OrderStore] Storage quota exceeded, running emergency cleanup');
            
            // Try cleanup and simple update
            const cleanedOrders = get().cleanupOrderStorage();
            
            // Create a simple version of the updated order
            const targetOrder = cleanedOrders.find(o => o._id === orderId);
            if (targetOrder) {
              // Update just the status without additional metadata
              const simpleUpdate = { ...targetOrder, status: newStatus };
              const orderIndex = cleanedOrders.findIndex(o => o._id === orderId);
              
              if (orderIndex !== -1) {
                // Replace the order with updated status
                cleanedOrders[orderIndex] = simpleUpdate;
                set({ orders: cleanedOrders });
                
                // Return the updated order
                return simpleUpdate;
              }
            }
          }
          
          // Re-throw the error so it can be handled by the UI
          throw error;
        }
      },
    }),
    {
      name: 'sinosply-order-storage',
      partialize: (state) => ({ 
        orderInfo: state.orderInfo,
        trackingInfo: state.trackingInfo,
        // Optimize orders for storage by limiting and cleaning up
        orders: state.orders.slice(0, MAX_STORED_ORDERS).map(optimizeOrderForStorage),
        selectedOrder: state.selectedOrder ? optimizeOrderForStorage(state.selectedOrder) : null,
        lastFetchTime: state.lastFetchTime
      }),
      // Add storage options to improve compression
      storage: {
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch (error) {
            console.error('[OrderStore] Error reading from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Before storing, let's check the size
            const approxSize = value.length * 2; // Rough estimate: 2 bytes per character
            console.log(`[OrderStore] Storing data of approx. ${Math.round(approxSize / 1024)} KB to localStorage`);
            
            // If it's too large, we need to handle gracefully
            if (approxSize > 4.5 * 1024 * 1024) { // 4.5MB is getting close to 5MB limit
              console.warn('[OrderStore] Data is too large for localStorage, cleaning up');
              
              // Try to clean up and retry with a smaller dataset
              const state = JSON.parse(value);
              if (state.state && state.state.orders) {
                const maxOrders = Math.max(20, Math.floor(MAX_STORED_ORDERS / 2));
                console.log(`[OrderStore] Emergency cleanup: keeping only ${maxOrders} most recent orders`);
                
                // Sort and limit orders
                const sortedOrders = [...state.state.orders].sort((a, b) => {
                  const dateA = new Date(a.updatedAt || a.createdAt || 0);
                  const dateB = new Date(b.updatedAt || b.createdAt || 0);
                  return dateB - dateA;
                }).slice(0, maxOrders);
                
                state.state.orders = sortedOrders;
                
                // Remove image data from all orders
                state.state.orders = state.state.orders.map(order => {
                  const cleaned = {...order};
                  if (cleaned.paymentReceipt) {
                    cleaned.paymentReceipt = {...cleaned.paymentReceipt, imageData: '[REMOVED]'};
                  }
                  if (Array.isArray(cleaned.items)) {
                    cleaned.items = cleaned.items.map(item => ({
                      ...item, 
                      image: item.image && item.image.startsWith('data:') ? '[REMOVED]' : item.image
                    }));
                  }
                  return cleaned;
                });
                
                // Try to save the cleaned-up version
                const reducedValue = JSON.stringify(state);
                localStorage.setItem(name, reducedValue);
                console.log('[OrderStore] Saved reduced dataset to localStorage');
                return;
              }
              
              throw new Error('Data too large for localStorage and could not be reduced');
            }
            
            localStorage.setItem(name, value);
          } catch (error) {
            console.error('[OrderStore] Error writing to localStorage:', error);
            // If we can't save due to quota, clear previous data and try again
            try {
              localStorage.removeItem(name);
              console.log('[OrderStore] Removed previous data, attempting to save smaller subset');
            } catch (clearError) {
              console.error('[OrderStore] Could not clear localStorage:', clearError);
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('[OrderStore] Error removing from localStorage:', error);
          }
        }
      }
    }
  )
); 