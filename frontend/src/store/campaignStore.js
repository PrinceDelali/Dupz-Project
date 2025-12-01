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
  const prefix = `[CAMPAIGNS API] ${operation} - ${timestamp}`;
  
  logMethod(`${prefix}: ${message}`);
  if (data) {
    if (isError) {
      console.error(`${prefix} Details:`, data);
    } else {
      console.log(`${prefix} Details:`, data);
    }
  }
};

// Helper functions for caching
function filterCampaigns(campaigns, searchTerm) {
  if (!searchTerm) return campaigns;
  
  const term = searchTerm.toLowerCase();
  return campaigns.filter(campaign => 
    (campaign.title && campaign.title.toLowerCase().includes(term)) ||
    (campaign.subject && campaign.subject.toLowerCase().includes(term))
  );
}

function paginateResults(results, page, limit) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return results.slice(startIndex, endIndex);
}

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

export const useCampaignStore = create(
  persist(
    (set, get) => ({
      campaigns: [],
      totalCampaigns: 0,
      currentPage: 1,
      totalPages: 1,
      isLoading: false,
      error: null,
      selectedCampaign: null,
      lastFetchTime: null,
      
      // Fetch campaigns from the API
      fetchCampaigns: async (page = 1, limit = 10, search = '', forceRefresh = false) => {
        if (fetchInProgress) {
          logApiOperation('FETCH', `Request skipped - fetch already in progress`);
          return get().campaigns;
        }
        
        if (fetchDebounceTimer) {
          clearTimeout(fetchDebounceTimer);
        }
        
        return new Promise((resolve) => {
          fetchDebounceTimer = setTimeout(async () => {
            try {
              fetchInProgress = true;
              
              const now = Date.now();
              const lastFetch = get().lastFetchTime;
              const cachedCampaigns = get().campaigns;
              
              logApiOperation('FETCH', `Requested page ${page}, limit ${limit}, search "${search}", forceRefresh: ${forceRefresh}`);
              
              if (!forceRefresh && lastFetch && cachedCampaigns.length > 0 && now - lastFetch < CACHE_DURATION) {
                logApiOperation('CACHE', `Using cached campaign data from ${new Date(lastFetch).toLocaleString()}`);
                
                const filteredCache = filterCampaigns(cachedCampaigns, search);
                const totalResults = filteredCache.length;
                const paginatedResults = paginateResults(filteredCache, page, limit);
                
                set({
                  currentPage: page,
                  totalPages: Math.ceil(totalResults / limit),
                  isLoading: false,
                });
                
                resolve(paginatedResults);
                return;
              }
              
              set({ isLoading: true, error: null });
              
              logApiOperation('API', `Making API request to ${apiConfig.baseURL}/campaigns`);
              const requestStartTime = Date.now();
              
              // Use custom axios instance to prevent logout on 401
              const customAxios = createCustomAxios();
              
              try {
                const response = await customAxios.get(`${apiConfig.baseURL}/campaigns`, {
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
                logApiOperation('API', `Request succeeded in ${requestDuration}ms, received ${response.data.data.length} campaigns`);
                
                set({ 
                  campaigns: response.data.data,
                  totalCampaigns: response.data.total,
                  totalPages: response.data.pages || Math.ceil(response.data.total / limit),
                  currentPage: page,
                  isLoading: false,
                  lastFetchTime: Date.now(),
                });
                
                resolve(response.data.data);
              } catch (apiErr) {
                // Handle 401 errors gracefully here without triggering logout
                if (apiErr.response?.status === 401) {
                  logApiOperation('AUTH', `Authentication error (401) but preventing auto-logout`, apiErr, true);
                  
                  // Return cached data if we have it
                  if (cachedCampaigns.length > 0) {
                    const filteredCache = filterCampaigns(cachedCampaigns, search);
                    const paginatedResults = paginateResults(filteredCache, page, limit);
                    
                    set({
                      isLoading: false,
                      error: 'Authentication error - please check your login status',
                      currentPage: page,
                      totalPages: Math.ceil(filteredCache.length / limit),
                    });
                    
                    resolve(paginatedResults);
                    return;
                  }
                  
                  // Otherwise, set error but don't throw
                  set({
                    isLoading: false,
                    error: 'Authentication error - please check your login status'
                  });
                  
                  resolve([]);
                  return;
                }
                
                throw apiErr; // Re-throw for other errors
              }
            } catch (err) {
              logApiOperation('ERROR', `API request failed: ${err.message}`, err, true);
              
              const cachedCampaigns = get().campaigns;
              if (cachedCampaigns.length > 0) {
                logApiOperation('RECOVERY', `Using cached data as fallback due to API failure`);
                
                const filteredCache = filterCampaigns(cachedCampaigns, search);
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
                set({ 
                  error: err.response?.data?.message || 'Failed to fetch campaigns',
                  isLoading: false 
                });
                
                resolve([]);
              }
            } finally {
              fetchInProgress = false;
            }
          }, 300);
        });
      },
      
      // Force reload from API and clear cache
      forceRefresh: async (page = 1, limit = 10, search = '') => {
        logApiOperation('REFRESH', `Force refreshing campaign data`);
        return get().fetchCampaigns(page, limit, search, true);
      },
      
      // Get cached data
      getCampaigns: () => get().campaigns,
      
      // Get a campaign by ID
      getCampaignById: (id) => {
        logApiOperation('GET_BY_ID', `Looking up campaign with ID: ${id}`);
        
        const cachedCampaign = get().campaigns.find(campaign => campaign._id === id);
        
        if (cachedCampaign) {
          logApiOperation('GET_BY_ID', `Found campaign ${id} in cache`);
          return cachedCampaign;
        }
        
        logApiOperation('GET_BY_ID', `Campaign ${id} not found in cache, fetching from API`);
        return get().fetchCampaignById(id);
      },
      
      // Fetch a single campaign from API
      fetchCampaignById: async (id) => {
        logApiOperation('FETCH_ONE', `Fetching campaign ${id} from API`);
        
        try {
          const requestStartTime = Date.now();
          
          const response = await axios.get(`${apiConfig.baseURL}/campaigns/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const requestDuration = Date.now() - requestStartTime;
          logApiOperation('FETCH_ONE', `Fetched campaign ${id} in ${requestDuration}ms`);
          
          const existingCampaigns = get().campaigns;
          const isInCache = existingCampaigns.some(c => c._id === id);
          
          if (!isInCache) {
            logApiOperation('CACHE', `Adding campaign ${id} to cache`);
            set({
              campaigns: [...existingCampaigns, response.data.data]
            });
          }
          
          return response.data.data;
        } catch (err) {
          logApiOperation('ERROR', `Failed to fetch campaign ${id}: ${err.message}`, err, true);
          throw err;
        }
      },
      
      // Create a new campaign
      createCampaign: async (campaignData) => {
        try {
          set({ isLoading: true, error: null });
          
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.post(`${apiConfig.baseURL}/campaigns`, campaignData, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            set({
              campaigns: [response.data.data, ...get().campaigns],
              totalCampaigns: get().totalCampaigns + 1,
              isLoading: false
            });
            
            return response.data.data;
          } catch (apiErr) {
            // Handle 401 errors gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) creating campaign, but preventing auto-logout`, apiErr, true);
              
              set({
                isLoading: false,
                error: 'Authentication error - please check your login status'
              });
              
              throw new Error('Authentication error - please check your login status');
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          set({ 
            error: err.response?.data?.message || err.message || 'Failed to create campaign',
            isLoading: false 
          });
          throw err;
        }
      },
      
      // Update a campaign
      updateCampaign: async (id, campaignData) => {
        logApiOperation('UPDATE', `Updating campaign ${id}`, campaignData);
        
        try {
          set({ isLoading: true, error: null });
          
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.put(`${apiConfig.baseURL}/campaigns/${id}`, campaignData, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            const updatedCampaigns = get().campaigns.map(campaign => 
              campaign._id === id ? { ...campaign, ...response.data.data } : campaign
            );
            
            set({
              campaigns: updatedCampaigns,
              isLoading: false,
              // If this is the selected campaign, update it too
              selectedCampaign: get().selectedCampaign?._id === id 
                ? { ...get().selectedCampaign, ...response.data.data }
                : get().selectedCampaign
            });
            
            logApiOperation('UPDATE', `Campaign ${id} updated successfully`);
            return response.data.data;
          } catch (apiErr) {
            // Handle 401 errors gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) updating campaign ${id}, but preventing auto-logout`, apiErr, true);
              
              set({
                isLoading: false,
                error: 'Authentication error - please check your login status'
              });
              
              throw new Error('Authentication error - please check your login status');
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('ERROR', `Failed to update campaign ${id}: ${err.message}`, err, true);
          set({ 
            error: err.response?.data?.message || 'Failed to update campaign',
            isLoading: false 
          });
          throw err;
        }
      },
      
      // Delete a campaign
      deleteCampaign: async (id) => {
        logApiOperation('DELETE', `Attempting to delete campaign ${id}`);
        
        try {
          set({ isLoading: true, error: null });
          
          const customAxios = createCustomAxios();
          
          try {
            await customAxios.delete(`${apiConfig.baseURL}/campaigns/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            set({
              campaigns: get().campaigns.filter(campaign => campaign._id !== id),
              totalCampaigns: get().totalCampaigns - 1,
              isLoading: false,
              // If this was the selected campaign, clear it
              selectedCampaign: get().selectedCampaign?._id === id ? null : get().selectedCampaign
            });
            
            logApiOperation('DELETE', `Campaign ${id} successfully deleted`);
            return true;
          } catch (apiErr) {
            // Handle 401 errors gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) deleting campaign ${id}, but preventing auto-logout`, apiErr, true);
              
              set({
                isLoading: false,
                error: 'Authentication error - please check your login status'
              });
              
              throw new Error('Authentication error - please check your login status');
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('ERROR', `Failed to delete campaign ${id}: ${err.message}`, err, true);
          set({ 
            error: err.response?.data?.message || 'Failed to delete campaign',
            isLoading: false 
          });
          throw err;
        }
      },
      
      // Send a campaign to recipients
      sendCampaign: async (id, recipientType = 'all') => {
        logApiOperation('SEND', `Sending campaign ${id} to ${recipientType} recipients`);
        
        try {
          set({ isLoading: true, error: null });
          
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.post(`${apiConfig.baseURL}/campaigns/${id}/send`, 
              { recipientType },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            
            // Update campaign status in cache
            const updatedCampaigns = get().campaigns.map(campaign => 
              campaign._id === id 
                ? { ...campaign, status: 'sent', sentAt: new Date().toISOString() } 
                : campaign
            );
            
            set({ 
              campaigns: updatedCampaigns,
              isLoading: false,
              selectedCampaign: get().selectedCampaign?._id === id 
                ? { ...get().selectedCampaign, status: 'sent', sentAt: new Date().toISOString() }
                : get().selectedCampaign
            });
            
            logApiOperation('SEND', `Campaign ${id} sent successfully to ${response.data.recipientCount} recipients`);
            return response.data;
          } catch (apiErr) {
            // Handle 401 errors gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) sending campaign ${id}, but preventing auto-logout`, apiErr, true);
              
              set({
                isLoading: false,
                error: 'Authentication error - please check your login status'
              });
              
              throw new Error('Authentication error - please check your login status');
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('ERROR', `Failed to send campaign ${id}: ${err.message}`, err, true);
          set({ 
            error: err.response?.data?.message || 'Failed to send campaign',
            isLoading: false 
          });
          throw err;
        }
      },
      
      // Select a campaign for viewing or editing
      selectCampaign: (id) => {
        const campaign = get().getCampaignById(id);
        set({ selectedCampaign: campaign || null });
        return campaign;
      },
      
      // Clear selected campaign
      clearSelectedCampaign: () => set({ selectedCampaign: null }),
      
      // Reset store state
      resetStore: () => {
        logApiOperation('RESET', 'Resetting campaign store state');
        
        set({
          campaigns: [],
          totalCampaigns: 0,
          currentPage: 1,
          totalPages: 1,
          isLoading: false,
          error: null,
          selectedCampaign: null,
          lastFetchTime: null
        });
      },
      
      // Get campaign statistics
      getCampaignStats: async () => {
        logApiOperation('STATS', `Fetching campaign statistics`);
        
        try {
          const token = localStorage.getItem('token');
          
          // If no token is available, return default stats from current campaigns
          if (!token) {
            logApiOperation('STATS', `No auth token, using client-side calculations`);
            const campaigns = get().campaigns;
            
            // Calculate basic stats from cached data
            const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
            const totalRecipients = campaigns.reduce((total, c) => total + (c.recipientCount || 0), 0);
            const totalOpens = campaigns.reduce((total, c) => total + (c.opened || 0), 0);
            const totalClicks = campaigns.reduce((total, c) => total + (c.clicked || 0), 0);
            
            // Calculate open and click rates
            const avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
            const avgClickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
            
            const stats = {
              totalCampaigns: campaigns.length,
              sentCampaigns,
              totalRecipients,
              totalOpens,
              totalClicks,
              avgOpenRate,
              avgClickRate
            };
            
            logApiOperation('STATS', `Generated client-side stats`);
            return stats;
          }
          
          // If we have a token, fetch from API
          const customAxios = createCustomAxios();
          
          try {
            const response = await customAxios.get(`${apiConfig.baseURL}/campaigns/stats`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            logApiOperation('STATS', `Fetched campaign stats from API`);
            return response.data.data;
          } catch (apiErr) {
            // Handle 401 errors gracefully
            if (apiErr.response?.status === 401) {
              logApiOperation('AUTH', `Authentication error (401) fetching campaign stats, but preventing auto-logout`, apiErr, true);
              
              // Fall back to client-side stats
              const campaigns = get().campaigns;
              
              // Calculate basic stats from cached data
              const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
              const totalRecipients = campaigns.reduce((total, c) => total + (c.recipientCount || 0), 0);
              const totalOpens = campaigns.reduce((total, c) => total + (c.opened || 0), 0);
              const totalClicks = campaigns.reduce((total, c) => total + (c.clicked || 0), 0);
              
              // Calculate open and click rates
              const avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
              const avgClickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
              
              const stats = {
                totalCampaigns: campaigns.length,
                sentCampaigns,
                totalRecipients,
                totalOpens,
                totalClicks,
                avgOpenRate,
                avgClickRate
              };
              
              logApiOperation('STATS', `Generated client-side stats as fallback for auth error`);
              return stats;
            }
            
            throw apiErr; // Re-throw other errors
          }
        } catch (err) {
          logApiOperation('ERROR', `Failed to fetch campaign stats: ${err.message}`, err, true);
          
          // Calculate basic stats as fallback
          const campaigns = get().campaigns;
          const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
          
          return {
            totalCampaigns: campaigns.length,
            sentCampaigns,
            totalRecipients: 0,
            totalOpens: 0,
            totalClicks: 0,
            avgOpenRate: 0,
            avgClickRate: 0
          };
        }
      }
    }),
    {
      name: 'sinosply-campaigns-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        campaigns: state.campaigns,
        totalCampaigns: state.totalCampaigns, 
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        selectedCampaign: state.selectedCampaign,
        lastFetchTime: state.lastFetchTime
      })
    }
  )
); 