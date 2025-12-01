import { create } from 'zustand';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const useQuoteStore = create((set, get) => ({
  quotes: [],
  isLoading: false,
  error: null,
  currentQuote: null,
  pagination: {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10
  },
  filters: {
    status: '',
    search: '',
    dateRange: {
      startDate: null,
      endDate: null
    },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        status: '',
        search: '',
        dateRange: {
          startDate: null,
          endDate: null
        },
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    });
  },

  // Update filters
  updateFilters: (newFilters) => {
    set({
      filters: {
        ...get().filters,
        ...newFilters
      }
    });
  },

  // Submit a new quote request
  submitQuote: async (quoteData, files, progressCallback) => {
    set({ isLoading: true, error: null });
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add quote data
      formData.append('quoteData', JSON.stringify(quoteData));
      
      // Add files
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`files`, file);
        });
      }
      
      const response = await axios.post(
        `${apiConfig.baseURL}/quotes`,
        formData,
        {
          headers: {
            ...apiConfig.headers,
            ...apiConfig.getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            if (progressCallback) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              progressCallback(percentCompleted);
            }
          }
        }
      );
      
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to submit quote request' 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch all quotes with pagination and filters (for admin)
  fetchQuotes: async (page = 1, pageSize = 10) => {
    const { filters } = get();
    set({ isLoading: true, error: null });
    
    try {
      console.log("Fetching quotes with filters:", JSON.stringify(filters, null, 2));
      
      // Sanitize search term
      const sanitizedSearch = filters.search ? filters.search.trim() : '';
      
      const response = await axios.get(
        `${apiConfig.baseURL}/admin/quotes`,
        {
          params: {
            page,
            pageSize,
            status: filters.status,
            search: sanitizedSearch,
            startDate: filters.dateRange.startDate,
            endDate: filters.dateRange.endDate,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
          },
          headers: {
            ...apiConfig.headers,
            ...apiConfig.getAuthHeader()
          }
        }
      );
      
      // Check the structure of the response 
      console.log("Quote response:", response.data);
      
      // Handle the different response structure
      const quotes = response.data.quotes || response.data;
      const paginationData = response.data.pagination || {
        totalItems: quotes.length,
        totalPages: 1,
        currentPage: page,
        pageSize
      };
      
      // Log search results
      if (sanitizedSearch) {
        console.log(`Search for "${sanitizedSearch}" found ${quotes.length} results`);
      }
      
      set({ 
        quotes: quotes,
        pagination: {
          totalItems: paginationData.totalItems,
          totalPages: paginationData.totalPages,
          currentPage: paginationData.currentPage,
          pageSize: paginationData.pageSize
        },
        error: quotes.length === 0 && sanitizedSearch 
          ? `No quotes found matching "${sanitizedSearch}"`
          : null
      });
      
      return response.data;
    } catch (error) {
      console.error("Error fetching quotes:", error);
      
      // Create a more user-friendly error message
      let errorMessage = 'Failed to fetch quotes';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      set({ 
        error: errorMessage,
        quotes: []
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Get a single quote by ID
  getQuoteById: async (quoteId) => {
    set({ isLoading: true, error: null, currentQuote: null });
    
    try {
      const response = await axios.get(
        `${apiConfig.baseURL}/admin/quotes/${quoteId}`,
        {
          headers: {
            ...apiConfig.headers,
            ...apiConfig.getAuthHeader()
          }
        }
      );
      
      set({ currentQuote: response.data });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch quote details' 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Update quote status
  updateQuoteStatus: async (quoteId, status, notes) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.patch(
        `${apiConfig.baseURL}/admin/quotes/${quoteId}/status`,
        {
          status,
          notes
        },
        {
          headers: {
            ...apiConfig.headers,
            ...apiConfig.getAuthHeader()
          }
        }
      );
      
      // Update the quotes list if it exists
      const quotes = get().quotes;
      if (quotes.length) {
        const updatedQuotes = quotes.map(quote => 
          quote._id === quoteId ? { ...quote, status, notes } : quote
        );
        set({ quotes: updatedQuotes });
      }
      
      // Update current quote if it's the one being edited
      const currentQuote = get().currentQuote;
      if (currentQuote && currentQuote._id === quoteId) {
        set({ currentQuote: { ...currentQuote, status, notes } });
      }
      
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update quote status' 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete a quote
  deleteQuote: async (quoteId) => {
    set({ isLoading: true, error: null });
    
    try {
      await axios.delete(
        `${apiConfig.baseURL}/admin/quotes/${quoteId}`,
        {
          headers: {
            ...apiConfig.headers,
            ...apiConfig.getAuthHeader()
          }
        }
      );
      
      // Remove the quote from the list
      const updatedQuotes = get().quotes.filter(quote => quote._id !== quoteId);
      set({ quotes: updatedQuotes });
      
      return { success: true };
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete quote' 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useQuoteStore; 