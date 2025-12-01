import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiConfig from '../config/apiConfig';
import axios from 'axios';

// Helper function to validate image URLs
const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Helper function to process collections data
const processCollectionData = (collection) => {
  // Ensure we have all required fields
  return {
    ...collection,
    // Only use placeholder if image is null, empty, or invalid
    image: collection.image && isValidImageUrl(collection.image) 
      ? collection.image 
      : `https://via.placeholder.com/800x800?text=${encodeURIComponent(collection.name || 'Collection')}`,
    // Ensure products is always an array
    products: Array.isArray(collection.products) ? collection.products : []
  };
};

export const useCollectionsStore = create(
  persist(
    (set, get) => ({
      collections: [], // All collections
      featuredCollections: [], // Collections marked as featured
      loading: false,
      error: null,
      lastFetch: null,
      
      // Set loading state
      setLoading: (loading) => set({ loading }),
      
      // Set error state
      setError: (error) => set({ error }),
      
      // Set all collections
      setCollections: (collections) => {
        console.log(`[collectionsStore] Setting ${collections.length} collections`);
        
        // Process each collection to ensure consistent data
        const processedCollections = collections.map(processCollectionData);
        
        // Update collections
        set({ 
          collections: processedCollections,
          loading: false,
          error: null,
          lastFetch: new Date().toISOString()
        });
        
        // Update derived state
        const featuredCollections = processedCollections.filter(c => c.featured);
        console.log(`[collectionsStore] Found ${featuredCollections.length} featured collections`);
        
        set({ featuredCollections });
      },
      
      // Add a single collection
      addCollection: (collection) => {
        console.log('[collectionsStore] Adding/updating collection:', collection.name);
        
        const collections = get().collections;
        const processedCollection = processCollectionData(collection);
        
        // Check if collection already exists
        const exists = collections.some(c => c._id === collection._id);
        
        if (exists) {
          // Update existing collection
          console.log('[collectionsStore] Updating existing collection:', collection._id);
          const updatedCollections = collections.map(c => 
            c._id === collection._id ? processedCollection : c
          );
          set({ collections: updatedCollections });
        } else {
          // Add new collection
          console.log('[collectionsStore] Adding new collection with ID:', collection._id);
          set({ collections: [processedCollection, ...collections] });
        }
        
        // Update derived state
        const allCollections = exists 
          ? collections.map(c => c._id === collection._id ? processedCollection : c)
          : [processedCollection, ...collections];
          
        const featuredCollections = allCollections.filter(c => c.featured);
        
        set({ featuredCollections });
      },
      
      // Get all collections
      getCollections: () => get().collections,
      
      // Get featured collections
      getFeaturedCollections: () => get().featuredCollections,
      
      // Get collection by ID
      getCollectionById: (id) => {
        const collections = get().collections;
        return collections.find(c => c._id === id);
      },
      
      // Get collection by slug
      getCollectionBySlug: (slug) => {
        const collections = get().collections;
        return collections.find(c => c.slug === slug);
      },
      
      // Search collections
      searchCollections: (query) => {
        if (!query || query.trim() === '') {
          return get().collections;
        }
        
        const collections = get().collections;
        const searchTerms = query.toLowerCase().split(' ');
        
        return collections.filter(collection => {
          const searchableText = `
            ${collection.name} 
            ${collection.description || ''}
          `.toLowerCase();
          
          return searchTerms.every(term => searchableText.includes(term));
        });
      },
      
      // Remove a collection
      removeCollection: (id) => {
        console.log('[collectionsStore] Removing collection:', id);
        const collections = get().collections;
        const updatedCollections = collections.filter(c => c._id !== id);
        
        set({ collections: updatedCollections });
        
        // Update derived state
        const featuredCollections = updatedCollections.filter(c => c.featured);
        
        set({ featuredCollections });
      },
      
      // Clear all collections
      clearCollections: () => {
        console.log('[collectionsStore] Clearing all collections');
        set({ 
          collections: [],
          featuredCollections: [],
          loading: false,
          error: null
        });
      },
      
      // Fetch collections from API
      fetchCollectionsFromAPI: async (includeProducts = false) => {
        const currentState = get();
        
        // Skip redundant fetches if we have data and it's recent (within last 5 minutes)
        if (currentState.collections.length > 0 && currentState.lastFetch) {
          const lastFetchTime = new Date(currentState.lastFetch).getTime();
          const now = new Date().getTime();
          const minutesSinceLastFetch = (now - lastFetchTime) / (1000 * 60);
          
          if (minutesSinceLastFetch < 5) {
            console.log(`[collectionsStore] Using cached collections data (${minutesSinceLastFetch.toFixed(1)} minutes old)`);
            return currentState.collections;
          }
        }
        
        try {
          console.log('[collectionsStore] Fetching collections from API');
          set({ loading: true, error: null });
          
          // Build the URL with appropriate params
          let url = `${apiConfig.baseURL}/collections`;
          if (includeProducts) {
            url += '?populate=products';
          }
          
          // Use axios for better error handling
          const response = await axios.get(url);
          const data = response.data;
          
          if (data.success) {
            console.log(`[collectionsStore] Successfully fetched ${data.data.length} collections`);
            
            // Process collections to ensure consistent data
            const processedCollections = data.data.map(processCollectionData);
            
            // Update collections in store
            set({ 
              collections: processedCollections,
              loading: false,
              error: null,
              lastFetch: new Date().toISOString()
            });
            
            // Update derived state
            const featuredCollections = processedCollections.filter(c => c.featured);
            console.log(`[collectionsStore] Found ${featuredCollections.length} featured collections`);
            
            set({ featuredCollections });
            
            return processedCollections;
          } else {
            console.error('[collectionsStore] API call failed:', data.message || 'Unknown error');
            set({ 
              loading: false, 
              error: data.message || 'Failed to fetch collections' 
            });
            return [];
          }
        } catch (error) {
          console.error('[collectionsStore] Error fetching collections:', error);
          set({ 
            loading: false, 
            error: error.message || 'Failed to fetch collections' 
          });
          return [];
        }
      }
    }),
    {
      name: 'sinosply-collections-storage',
      partialize: (state) => ({ 
        collections: state.collections,
        featuredCollections: state.featuredCollections,
        lastFetch: state.lastFetch
      }),
      version: 2, // Increment version to handle schema changes
      onRehydrateStorage: (state) => {
        // Called when the persisted state is rehydrated
        console.log('[collectionsStore] Rehydrating from storage');
        return (rehydratedState, error) => {
          if (error) {
            console.error('[collectionsStore] Rehydration error:', error);
          } else if (rehydratedState) {
            console.log(`[collectionsStore] Rehydrated ${rehydratedState.collections?.length || 0} collections`);
          }
        };
      }
    }
  )
); 