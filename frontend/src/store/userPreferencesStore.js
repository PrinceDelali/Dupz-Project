import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserPreferencesStore = create(
  persist(
    (set, get) => ({
      searchHistory: [], // Track user search queries
      viewedProducts: [], // Track products the user has viewed
      categoryPreferences: {}, // Track user category preferences
      colorPreferences: {}, // Track user color preferences
      priceRangePreference: { min: 0, max: 10000 }, // Default price range preference
      
      // Add a search term to history
      addSearchTerm: (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') return;
        
        const cleanTerm = searchTerm.trim().toLowerCase();
        const currentHistory = get().searchHistory;
        
        // Remove the term if it already exists (to add it to the front)
        const filteredHistory = currentHistory.filter(term => term !== cleanTerm);
        
        // Add the new term to the front, limit to 20 terms
        const newHistory = [cleanTerm, ...filteredHistory].slice(0, 20);
        
        set({ searchHistory: newHistory });
        console.log(`🔍 UserPreferencesStore: Added search term "${cleanTerm}" to history`);
      },
      
      // Add a viewed product
      addViewedProduct: (product) => {
        if (!product || !product._id) return;
        
        const currentViewed = get().viewedProducts;
        
        // Check if product is already in the list
        const existingIndex = currentViewed.findIndex(p => p._id === product._id);
        
        // Create simplified product object with essential info
        const simplifiedProduct = {
          _id: product._id,
          name: product.name,
          category: product.category,
          image: product.image || product.variants?.[0]?.image || product.variants?.[0]?.additionalImages?.[0],
          price: product.basePrice,
          color: product.variants?.[0]?.color,
          colorName: product.variants?.[0]?.colorName,
          viewedAt: new Date().toISOString(),
        };
        
        let newViewed;
        
        if (existingIndex >= 0) {
          // Update existing entry with new timestamp
          newViewed = [
            ...currentViewed.slice(0, existingIndex),
            simplifiedProduct,
            ...currentViewed.slice(existingIndex + 1)
          ];
        } else {
          // Add new entry, limit to 30 products
          newViewed = [simplifiedProduct, ...currentViewed].slice(0, 30);
        }
        
        set({ viewedProducts: newViewed });
        console.log(`👁️ UserPreferencesStore: Added product "${product.name}" to viewed history`);
        
        // Update category preferences when viewing a product
        if (product.category) {
          get().updateCategoryPreference(product.category);
        }
        
        // Update color preferences if available
        if (product.variants?.[0]?.color) {
          get().updateColorPreference(product.variants[0].color);
        }
      },
      
      // Update category preference
      updateCategoryPreference: (category) => {
        if (!category) return;
        
        const currentPreferences = get().categoryPreferences;
        const currentCount = currentPreferences[category] || 0;
        
        set({
          categoryPreferences: {
            ...currentPreferences,
            [category]: currentCount + 1
          }
        });
      },
      
      // Update color preference
      updateColorPreference: (color) => {
        if (!color) return;
        
        const currentPreferences = get().colorPreferences;
        const currentCount = currentPreferences[color] || 0;
        
        set({
          colorPreferences: {
            ...currentPreferences,
            [color]: currentCount + 1
          }
        });
      },
      
      // Update price range preference
      updatePriceRangePreference: (min, max) => {
        if (typeof min !== 'number' || typeof max !== 'number') return;
        
        set({
          priceRangePreference: { min, max }
        });
        
        console.log(`💰 UserPreferencesStore: Updated price range preference to ${min}-${max}`);
      },
      
      // Get top category preferences
      getTopCategoryPreferences: (limit = 3) => {
        const preferences = get().categoryPreferences;
        
        return Object.entries(preferences)
          .sort((a, b) => b[1] - a[1]) // Sort by count descending
          .slice(0, limit) // Take top N
          .map(entry => entry[0]); // Return just the category names
      },
      
      // Get top color preferences
      getTopColorPreferences: (limit = 3) => {
        const preferences = get().colorPreferences;
        
        return Object.entries(preferences)
          .sort((a, b) => b[1] - a[1]) // Sort by count descending
          .slice(0, limit) // Take top N
          .map(entry => entry[0]); // Return just the color codes
      },
      
      // Clear all preferences and history
      clearAllPreferences: () => {
        set({
          searchHistory: [],
          viewedProducts: [],
          categoryPreferences: {},
          colorPreferences: {},
          priceRangePreference: { min: 0, max: 10000 }
        });
        
        console.log('🧹 UserPreferencesStore: Cleared all user preferences and history');
      }
    }),
    {
      name: 'sinosply-user-preferences',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        viewedProducts: state.viewedProducts.slice(0, 10), // Only store the 10 most recent
        categoryPreferences: state.categoryPreferences,
        colorPreferences: state.colorPreferences,
        priceRangePreference: state.priceRangePreference
      })
    }
  )
);