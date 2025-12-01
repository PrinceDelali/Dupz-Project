import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

// Time constants for cache expiration (in milliseconds)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_REFRESH_THRESHOLD = 4 * 60 * 1000; // 4 minutes

// Debounce helper to prevent multiple API calls
let fetchDebounceTimer = null;
let fetchInProgress = false;

// Custom logger to track API operations
const logApiOperation = (operation, message, data = null, isError = false) => {
  const timestamp = new Date().toISOString();
  const logMethod = isError ? console.error : console.log;
  const prefix = `[CUSTOMERS API] ${operation} - ${timestamp}`;
  
  logMethod(`${prefix}: ${message}`);
  if (data) {
    if (isError) {
      console.error(`${prefix} Details:`, data);
    } else {
      console.log(`${prefix} Details:`, data);
    }
  }
};

// Create a custom axios instance to prevent global interceptors from auto-logging out
const createCustomAxios = () => {
  const token = localStorage.getItem('token');
  const instance = axios.create({
    baseURL: apiConfig.baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  // Don't add interceptors that trigger logout
  return instance;
};

export const useCustomersStore = create(
  persist(
    (set, get) => ({
      customers: [],
      totalCustomers: 0,
      currentPage: 1,
      totalPages: 1,
      isLoading: false,
      isBackgroundRefreshing: false,
      error: null,
      selectedCustomer: null,
      lastFetchTime: null,
      
      // Fast preload function with no debounce for admin dashboard
      preloadCustomers: async (limit = 100) => {
        console.log('[CustomersStore] Fast preloading customers data');
        
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.warn('[CustomersStore] No token available for preload');
            return { success: false };
          }
          
          // Set loading indicator, but don't block UI
          set({ isLoading: true, error: null });
          
          // Use custom axios instance to prevent logout on 401
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.get(`${apiConfig.baseURL}/users`, {
              params: {
                page: 1,
                limit,
                // No search filter for preload to get full dataset
              },
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            console.log(`[CustomersStore] Preload successful, loaded ${response.data.data.length} customers`);
            
            set({ 
              customers: response.data.data,
              totalCustomers: response.data.total,
              totalPages: response.data.pages || Math.ceil(response.data.total / limit),
              currentPage: 1,
              isLoading: false,
              lastFetchTime: Date.now(),
              isBackgroundRefreshing: false,
            });
            
            return { success: true, data: response.data.data };
          } catch (error) {
            console.error('[CustomersStore] Preload failed:', error);
            set({ isLoading: false, error: 'Failed to preload customers' });
            return { success: false, error };
          }
        } catch (error) {
          console.error('[CustomersStore] Preload exception:', error);
          set({ isLoading: false, error: 'Unexpected error during preload' });
          return { success: false, error };
        }
      },
      
      // Fetch customers from the API with caching
      fetchCustomers: async (page = 1, limit = 10, search = '', forceRefresh = false) => {
        // Prevent multiple concurrent fetch calls
        if (fetchInProgress) {
          logApiOperation('FETCH', `Request skipped - fetch already in progress`);
          return get().customers;
        }
        
        // Clear any pending debounce timer
        if (fetchDebounceTimer) {
          clearTimeout(fetchDebounceTimer);
        }
        
        // Check if we're making an admin dashboard request (large limit with force refresh)
        const isAdminDashboardRequest = limit >= 100 && forceRefresh;
        
        // For admin dashboard requests, use much shorter debounce or none at all
        const debounceDelay = isAdminDashboardRequest ? 50 : 200;
        
        // Debounce the fetch call to prevent rapid multiple calls
        return new Promise((resolve) => {
          fetchDebounceTimer = setTimeout(async () => {
            try {
              fetchInProgress = true;
              
              // Check if we have a cached version and it's not expired
              const now = Date.now();
              const lastFetch = get().lastFetchTime;
              const cachedCustomers = get().customers;
              
              logApiOperation('FETCH', `Requested page ${page}, limit ${limit}, search "${search}", forceRefresh: ${forceRefresh}`);
              
              // If we have cached data that isn't too old and we're not forcing refresh
              if (
                !forceRefresh && 
                lastFetch && 
                cachedCustomers.length > 0 && 
                now - lastFetch < CACHE_DURATION
              ) {
                logApiOperation('CACHE', `Using cached customer data from ${new Date(lastFetch).toLocaleString()}`);
                
                // If the data is getting stale, refresh in the background
                if (now - lastFetch > BACKGROUND_REFRESH_THRESHOLD) {
                  logApiOperation('CACHE', 'Cache is stale, triggering background refresh');
                  set({ isBackgroundRefreshing: true });
                  
                  // Refresh data in background
                  get().refreshInBackground(page, limit, search);
                }
                
                // Return filtered data from cache
                const filteredCache = filterCustomers(cachedCustomers, search);
                const totalResults = filteredCache.length;
                const paginatedResults = paginateResults(filteredCache, page, limit);
                
                logApiOperation('CACHE', `Returned ${paginatedResults.length} customers from cache (${totalResults} total matches)`);
                
                set({
                  currentPage: page,
                  totalPages: Math.ceil(totalResults / limit),
                  isLoading: false,
                });
                
                resolve(paginatedResults);
                return;
              }
              
              // If cache is expired or forced refresh, load from API
              set({ isLoading: true, error: null });
              
              logApiOperation('API', `Making API request to ${apiConfig.baseURL}/users`);
              const requestStartTime = Date.now();
              
              // Use custom axios instance to prevent logout on 401
              const customAxios = createCustomAxios();
              
              try {
                const response = await customAxios.get(`${apiConfig.baseURL}/users`, {
                  params: {
                    page,
                    limit,
                    search: search || undefined
                  },
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                });
                
                const requestDuration = Date.now() - requestStartTime;
                logApiOperation('API', `Request succeeded in ${requestDuration}ms, received ${response.data.data.length} customers`);
                
                set({ 
                  customers: response.data.data,
                  totalCustomers: response.data.total,
                  totalPages: response.data.pages || Math.ceil(response.data.total / limit),
                  currentPage: page,
                  isLoading: false,
                  lastFetchTime: Date.now(),
                  isBackgroundRefreshing: false,
                });
                
                resolve(response.data.data);
              } catch (apiErr) {
                // Handle 401 errors gracefully here without throwing
                if (apiErr.response?.status === 401) {
                  logApiOperation('AUTH', `Authentication error (401) but preventing auto-logout`, apiErr, true);
                  
                  // Don't throw the error - return empty data instead
                  set({
                    isLoading: false,
                    error: 'Authentication error - please check your login status',
                    isBackgroundRefreshing: false
                  });
                  
                  // Return cached data if we have it
                  if (cachedCustomers.length > 0) {
                    const filteredCache = filterCustomers(cachedCustomers, search);
                    const paginatedResults = paginateResults(filteredCache, page, limit);
                    resolve(paginatedResults);
                    return;
                  }
                  
                  resolve([]);
                  return;
                }
                
                throw apiErr; // Re-throw for other errors
              }
            } catch (err) {
              // Log the error details
              logApiOperation('ERROR', `API request failed: ${err.message}`, err, true);
              
              if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                logApiOperation('ERROR', `Server responded with status: ${err.response.status}`, err.response.data, true);
              } else if (err.request) {
                // The request was made but no response was received
                logApiOperation('ERROR', 'No response received from server', err.request, true);
              }
              
              // If API fails but we have cached data, use it as fallback
              const cachedCustomers = get().customers;
              if (cachedCustomers.length > 0) {
                logApiOperation('RECOVERY', `Using cached data as fallback due to API failure`);
                
                // Apply search filter to cached data
                const filteredCache = filterCustomers(cachedCustomers, search);
                const totalResults = filteredCache.length;
                const paginatedResults = paginateResults(filteredCache, page, limit);
                
                set({
                  isLoading: false,
                  error: `Using cached data from ${new Date(get().lastFetchTime).toLocaleString()}. Error: ${err.message}`,
                  currentPage: page,
                  totalPages: Math.ceil(totalResults / limit),
                });
                
                resolve(paginatedResults);
              } else {
                // If no cached data, show error
                set({ 
                  error: err.response?.data?.message || 'Failed to fetch customers',
                  isLoading: false 
                });
                
                resolve([]);
              }
            } finally {
              fetchInProgress = false;
            }
          }, debounceDelay); // Reduced debounce delay
        });
      },
      
      // Background refresh to keep cache up-to-date
      refreshInBackground: async (page, limit, search) => {
        // Prevent background refresh if already in progress
        if (get().isBackgroundRefreshing || fetchInProgress) {
          logApiOperation('BACKGROUND', `Background refresh skipped - another operation in progress`);
          return;
        }
        
        logApiOperation('BACKGROUND', `Starting background refresh for page ${page}`);
        set({ isBackgroundRefreshing: true });
        
        try {
          fetchInProgress = true;
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.get(`${apiConfig.baseURL}/users`, {
              params: { page, limit, search: search || undefined },
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            logApiOperation('BACKGROUND', `Successfully refreshed data in background, received ${response.data.data.length} customers`);
            
            set({
              customers: response.data.data,
              totalCustomers: response.data.total,
              totalPages: response.data.pages || Math.ceil(response.data.total / limit),
              lastFetchTime: Date.now(),
              isBackgroundRefreshing: false,
            });
          } catch (apiErr) {
            // If authentication error (401), log but don't trigger logout
            if (apiErr.response?.status === 401) {
              logApiOperation('BACKGROUND', 'Background refresh auth error (401) but preventing auto-logout', apiErr, true);
              set({ isBackgroundRefreshing: false });
              return;
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('BACKGROUND', `Background refresh failed: ${err.message}`, err, true);
          set({ isBackgroundRefreshing: false });
        } finally {
          fetchInProgress = false;
        }
      },
      
      // Force reload from API and clear cache
      forceRefresh: async (page = 1, limit = 10, search = '') => {
        logApiOperation('REFRESH', `Force refreshing customer data`);
        return get().fetchCustomers(page, limit, search, true);
      },
      
      // Check if cache is stale
      isCacheStale: () => {
        const lastFetch = get().lastFetchTime;
        return !lastFetch || (Date.now() - lastFetch > CACHE_DURATION);
      },
      
      // Get cached data
      getCustomers: () => get().customers,
      
      // Get a customer by ID
      getCustomerById: (id) => {
        logApiOperation('GET_BY_ID', `Looking up customer with ID: ${id}`);
        
        // First check cache
        const cachedCustomer = get().customers.find(customer => customer._id === id);
        
        if (cachedCustomer) {
          logApiOperation('GET_BY_ID', `Found customer ${id} in cache`);
          return cachedCustomer;
        }
        
        logApiOperation('GET_BY_ID', `Customer ${id} not found in cache, fetching from API`);
        // If not in cache, fetch from API
        return get().fetchCustomerById(id);
      },
      
      // Fetch a single customer from API
      fetchCustomerById: async (id) => {
        logApiOperation('FETCH_ONE', `Fetching customer ${id} from API`);
        
        try {
          const requestStartTime = Date.now();
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.get(`${apiConfig.baseURL}/users/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            const requestDuration = Date.now() - requestStartTime;
            logApiOperation('FETCH_ONE', `Fetched customer ${id} in ${requestDuration}ms`);
            
            // Add to cache if not already there
            const existingCustomers = get().customers;
            const isInCache = existingCustomers.some(c => c._id === id);
            
            if (!isInCache) {
              logApiOperation('CACHE', `Adding customer ${id} to cache`);
              set({
                customers: [...existingCustomers, response.data.data]
              });
            }
            
            return response.data.data;
          } catch (apiErr) {
            // If authentication error (401), handle gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) fetching customer ${id}, but preventing auto-logout`, apiErr, true);
              throw new Error('Authentication error - please check your login status');
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('ERROR', `Failed to fetch customer ${id}: ${err.message}`, err, true);
          
          if (err.response?.status === 404) {
            logApiOperation('ERROR', `Customer ${id} not found`, null, true);
          } else if (err.response?.status === 400) {
            logApiOperation('ERROR', `Invalid customer ID format: ${id}`, null, true);
          }
          
          throw err;
        }
      },
      
      // Select a customer for viewing or editing
      selectCustomer: (id) => {
        const customer = get().getCustomerById(id);
        set({ selectedCustomer: customer || null });
        return customer;
      },
      
      // Clear selected customer
      clearSelectedCustomer: () => set({ selectedCustomer: null }),
      
      // Delete a customer
      deleteCustomer: async (id) => {
        logApiOperation('DELETE', `Attempting to delete customer ${id}`);
        
        try {
          set({ isLoading: true, error: null });
          const customAxios = createCustomAxios();
          
          try {
            await customAxios.delete(`${apiConfig.baseURL}/users/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Remove from local state
            const updatedCustomers = get().customers.filter(customer => customer._id !== id);
            set({ 
              customers: updatedCustomers,
              totalCustomers: get().totalCustomers - 1,
              isLoading: false
            });
            
            logApiOperation('DELETE', `Customer ${id} successfully deleted`);
            return true;
          } catch (apiErr) {
            // If authentication error (401), handle gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) deleting customer ${id}, but preventing auto-logout`, apiErr, true);
              throw new Error('Authentication error - please check your login status');
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('ERROR', `Failed to delete customer ${id}: ${err.message}`, err, true);
          
          set({ 
            error: err.response?.data?.message || 'Failed to delete customer',
            isLoading: false 
          });
          throw err;
        }
      },
      
      // Add a customer to local store (usually after a successful API call)
      addCustomer: (customer) => {
        logApiOperation('ADD', `Adding customer ${customer._id || 'new'} to store`);
        
        const customers = get().customers;
        set({ 
          customers: [customer, ...customers],
          totalCustomers: get().totalCustomers + 1
        });
      },
      
      // Update a customer
      updateCustomer: async (id, customerData) => {
        logApiOperation('UPDATE', `Updating customer ${id}`, { fields: Object.keys(customerData) });
        
        try {
          set({ isLoading: true, error: null });
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.put(`${apiConfig.baseURL}/users/${id}`, customerData, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Update in local state
            const updatedCustomers = get().customers.map(customer => 
              customer._id === id ? { ...customer, ...response.data.data } : customer
            );
            
            set({ 
              customers: updatedCustomers,
              isLoading: false,
              // If selected customer is the one being updated, update it too
              selectedCustomer: get().selectedCustomer?._id === id 
                ? { ...get().selectedCustomer, ...response.data.data }
                : get().selectedCustomer
            });
            
            logApiOperation('UPDATE', `Customer ${id} successfully updated`);
            return response.data.data;
          } catch (apiErr) {
            // If authentication error (401), handle gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) updating customer ${id}, but preventing auto-logout`, apiErr, true);
              throw new Error('Authentication error - please check your login status');
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('ERROR', `Failed to update customer ${id}: ${err.message}`, err, true);
          
          set({ 
            error: err.response?.data?.message || 'Failed to update customer',
            isLoading: false 
          });
          throw err;
        }
      },
      
      // Reset store state
      resetStore: () => {
        logApiOperation('RESET', 'Resetting customer store state');
        
        set({
          customers: [],
          totalCustomers: 0,
          currentPage: 1,
          totalPages: 1,
          isLoading: false,
          error: null,
          selectedCustomer: null,
          lastFetchTime: null
        });
      }
    }),
    {
      name: 'sinosply-customers-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist the entire cache for offline support
        customers: state.customers,
        totalCustomers: state.totalCustomers, 
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        selectedCustomer: state.selectedCustomer,
        lastFetchTime: state.lastFetchTime
      })
    }
  )
);

// Helper function to filter customers by search term
function filterCustomers(customers, searchTerm) {
  if (!searchTerm) return customers;
  
  const term = searchTerm.toLowerCase();
  return customers.filter(customer => 
    (customer.firstName && customer.firstName.toLowerCase().includes(term)) ||
    (customer.lastName && customer.lastName.toLowerCase().includes(term)) ||
    (customer.email && customer.email.toLowerCase().includes(term))
  );
}

// Helper function to paginate results
function paginateResults(results, page, limit) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return results.slice(startIndex, endIndex);
} 