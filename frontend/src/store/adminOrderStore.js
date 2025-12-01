import { create } from 'zustand';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

// Sample data for fallback when API fails
const sampleOrders = [
  {
    _id: 'sample-1',
    orderNumber: 'ORD-10001',
    customerName: 'Sample Customer',
    customerEmail: 'sample@example.com',
    status: 'Pending',
    totalAmount: 150.00,
    items: 3,
    createdAt: new Date().toISOString(),
    trackingNumber: null
  },
  {
    _id: 'sample-2',
    orderNumber: 'ORD-10002',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    status: 'Delivered',
    totalAmount: 250.00,
    items: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    trackingNumber: 'TRK12345'
  }
];

export const useAdminOrderStore = create((set, get) => ({
  // Store state
  orders: [],
  filteredOrders: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  pagination: null,
  totalOrders: 0,
  usingSampleData: false,
  retryCount: 0,
  ordersExist: true,
  
  // Check if orders collection exists
  checkOrdersExist: async () => {
    try {
      console.log('🔍 [adminOrderStore] Checking if orders collection exists');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${apiConfig.baseURL}/admin/orders-check`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000 // Longer timeout for this operation
      });
      
      console.log('✅ [adminOrderStore] Orders check response:', response.data);
      
      // Store the result in the state
      set({ 
        ordersExist: response.data.exists,
        totalOrders: response.data.count || 0
      });
      
      // If orders don't exist, set sample empty state to prevent further API calls
      if (!response.data.exists) {
        console.log('ℹ️ [adminOrderStore] No orders collection exists, setting empty state');
        set({
          orders: [],
          filteredOrders: [],
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          totalOrders: 0,
          isLoading: false,
          error: null,
          lastFetched: new Date(),
          usingSampleData: false
        });
      }
      
      return response.data.exists;
    } catch (error) {
      console.error('❌ [adminOrderStore] Error checking if orders exist:', error);
      set({ 
        error: error.response?.data?.error || error.message, 
        isLoading: false,
        ordersExist: false
      });
      return false;
    }
  },
  
  // Get all orders from API
  fetchOrders: async (page = 1, limit = 10, status = 'all', search = '') => {
    // Check if orders exist before fetching
    const ordersExist = await get().checkOrdersExist();
    if (!ordersExist) {
      console.log('ℹ️ [adminOrderStore] Skipping fetchOrders since orders collection does not exist');
      return [];
    }
    
    try {
      console.log('🔍 [adminOrderStore] Starting fetchOrders...');
      console.log(`🔍 [adminOrderStore] Parameters: page=${page}, limit=${limit}, status=${status}, search=${search}`);
      
      set({ isLoading: true, error: null });
      
      const token = localStorage.getItem('token');
      console.log('🔑 [adminOrderStore] Token available:', !!token);
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      if (status !== 'all') {
        queryParams.append('status', status);
      }
      
      if (search) {
        queryParams.append('search', search);
      }
      
      // Use the API config with query params
      const API_URL = `${apiConfig.baseURL}/admin/orders?${queryParams.toString()}`;
      
      console.log('📡 [adminOrderStore] Sending request to:', API_URL);
      
      // Create cancel token
      const source = axios.CancelToken.source();
      
      // Set timeout to cancel request after specified time
      const timeoutId = setTimeout(() => {
        source.cancel('Request took too long');
      }, apiConfig.timeout);
      
      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: apiConfig.timeout,
          cancelToken: source.token
        });
        
        // Clear the timeout since request completed
        clearTimeout(timeoutId);
        
        console.log('✅ [adminOrderStore] Response received:', {
          success: response.data.success,
          count: response.data.count,
          dataLength: response.data.data?.length,
          pagination: response.data.pagination
        });
        
        if (response.data.success) {
          console.log('💾 [adminOrderStore] Storing', response.data.data?.length, 'orders in store');
          
          // Store pagination info along with the orders
          set({ 
            orders: response.data.data, 
            filteredOrders: response.data.data,
            pagination: response.data.pagination,
            totalOrders: response.data.count,
            lastFetched: new Date(),
            isLoading: false,
            usingSampleData: false,
            retryCount: 0
          });
          return response.data.data;
        } else {
          console.error('❌ [adminOrderStore] API reported failure:', response.data.error);
          throw new Error(response.data.error || 'Failed to fetch orders');
        }
      } catch (axiosError) {
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // If this is a timeout error, try using a direct MongoDB approach
        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          console.warn('⚠️ [adminOrderStore] Request timed out, trying fallback approach...');
          
          // Increment retry count
          const currentRetryCount = get().retryCount;
          set({ retryCount: currentRetryCount + 1 });
          
          // Check if orders collection exists before retrying
          const ordersStillExist = await get().checkOrdersExist();
          if (!ordersStillExist) {
            console.log('ℹ️ [adminOrderStore] Orders collection does not exist, no need to retry');
            return [];
          }
          
          // If we've retried 3 times already, use sample data
          if (currentRetryCount >= 2) {
            console.warn('⚠️ [adminOrderStore] Too many retries, using sample data');
            return get().useSampleData(page, limit);
          }
          
          // Try fetching with a streamlined endpoint (if it exists)
          try {
            const lightResponse = await axios.get(`${apiConfig.baseURL}/admin/orders-light?${queryParams.toString()}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: apiConfig.timeout
            });
            
            if (lightResponse.data.success) {
              console.log('✅ [adminOrderStore] Light endpoint succeeded');
              
              // Store the light data
              set({ 
                orders: lightResponse.data.data, 
                filteredOrders: lightResponse.data.data,
                pagination: lightResponse.data.pagination,
                totalOrders: lightResponse.data.count,
                lastFetched: new Date(),
                isLoading: false,
                usingSampleData: false
              });
              return lightResponse.data.data;
            } else {
              throw new Error('Light endpoint also failed');
            }
          } catch (lightError) {
            console.error('❌ [adminOrderStore] Light endpoint also failed:', lightError);
            return get().useSampleData(page, limit);
          }
        }
        
        throw axiosError;
      }
    } catch (error) {
      console.error('❌ [adminOrderStore] Error fetching orders:', error);
      
      // Check if we should use sample data
      if (error.code === 'ECONNABORTED' || 
          error.message.includes('timeout') || 
          error.message.includes('Network Error')) {
        return get().useSampleData(1, 10);
      }
      
      set({ 
        error: error.response?.data?.error || error.message, 
        isLoading: false 
      });
      return [];
    }
  },
  
  // Use sample data as fallback
  useSampleData: (page = 1, limit = 10) => {
    console.warn('⚠️ [adminOrderStore] Using sample data');
    
    // Create pagination data
    const pagination = {
      page,
      limit,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    };
    
    set({
      orders: sampleOrders,
      filteredOrders: sampleOrders,
      pagination,
      totalOrders: sampleOrders.length,
      lastFetched: new Date(),
      isLoading: false,
      error: 'Unable to connect to the server. Showing sample data.',
      usingSampleData: true
    });
    
    return sampleOrders;
  },
  
  // Refresh orders if needed (based on time threshold or force refresh)
  refreshOrdersIfNeeded: async (forceRefresh = false) => {
    console.log('🔄 [adminOrderStore] refreshOrdersIfNeeded called with forceRefresh:', forceRefresh);
    
    const { orders, lastFetched } = get();
    console.log('📊 [adminOrderStore] Current cache state:', { 
      ordersCount: orders.length, 
      lastFetched: lastFetched?.toISOString() || 'never'
    });
    
    // If no orders or force refresh, fetch orders
    if (orders.length === 0 || forceRefresh) {
      console.log('🔄 [adminOrderStore] Cache empty or force refresh requested');
      return get().fetchOrders();
    }
    
    // Check if data is stale (older than 5 minutes)
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (!lastFetched || now - lastFetched > staleThreshold) {
      console.log('🕒 [adminOrderStore] Cache is stale, refreshing data');
      return get().fetchOrders();
    }
    
    console.log('✅ [adminOrderStore] Using cached data');
    return orders;
  },
  
  // Filter orders by status
  filterOrdersByStatus: (status) => {
    const { orders } = get();
    
    if (!status || status === 'all') {
      set({ filteredOrders: orders });
    } else {
      set({ 
        filteredOrders: orders.filter(order => order.status.toLowerCase() === status.toLowerCase())
      });
    }
    
    return get().filteredOrders;
  },
  
  // Search orders by order number, customer name, or email
  searchOrders: (searchTerm) => {
    const { orders } = get();
    
    if (!searchTerm) {
      set({ filteredOrders: orders });
    } else {
      const term = searchTerm.toLowerCase();
      set({
        filteredOrders: orders.filter(order => 
          order.orderNumber.toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term) ||
          order.customerEmail.toLowerCase().includes(term) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(term))
        )
      });
    }
    
    return get().filteredOrders;
  },
  
  // Get order by ID
  getOrderById: (orderId) => {
    const { orders } = get();
    return orders.find(order => order._id === orderId);
  },
  
  // Get order by order number
  getOrderByNumber: (orderNumber) => {
    const { orders } = get();
    return orders.find(order => order.orderNumber === orderNumber);
  },
  
  // Update order status
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      set({ isLoading: true, error: null });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.patch(
        `${apiConfig.baseURL}/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update order in the local cache
        const { orders } = get();
        const updatedOrders = orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        );
        
        set({ 
          orders: updatedOrders,
          filteredOrders: updatedOrders,
          isLoading: false 
        });
        
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      set({ 
        error: error.response?.data?.error || error.message, 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Update order tracking information
  updateOrderTracking: async (orderId, trackingNumber, shippingMethod, estimatedDelivery) => {
    try {
      set({ isLoading: true, error: null });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const updateData = {
        trackingNumber,
        shippingMethod,
        estimatedDelivery: new Date(estimatedDelivery)
      };
      
      const response = await axios.patch(
        `${apiConfig.baseURL}/admin/orders/${orderId}/tracking`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update order in the local cache
        const { orders } = get();
        const updatedOrders = orders.map(order => 
          order._id === orderId ? { ...order, ...updateData } : order
        );
        
        set({ 
          orders: updatedOrders,
          filteredOrders: updatedOrders,
          isLoading: false 
        });
        
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to update tracking information');
      }
    } catch (error) {
      console.error('Error updating tracking information:', error);
      set({ 
        error: error.response?.data?.error || error.message, 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Get order statistics
  getOrderStats: () => {
    const { orders, usingSampleData } = get();
    
    // If using sample data, return sample stats
    if (usingSampleData) {
      return {
        totalOrders: orders.length,
        totalRevenue: 400.00,
        statusCounts: { 'Pending': 1, 'Delivered': 1 },
        recentOrders: 2,
        recentRevenue: 400.00
      };
    }
    
    // Calculate order statistics
    const totalOrders = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const statusCounts = orders.reduce((counts, order) => {
      const status = order.status.toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
    
    // Orders in the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= sevenDaysAgo;
    });
    
    const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    return {
      totalOrders,
      totalRevenue,
      statusCounts,
      recentOrders: recentOrders.length,
      recentRevenue
    };
  },
  
  // Clear store
  clearStore: () => {
    set({
      orders: [],
      filteredOrders: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      pagination: null,
      totalOrders: 0,
      usingSampleData: false,
      retryCount: 0,
      ordersExist: true
    });
  }
})); 