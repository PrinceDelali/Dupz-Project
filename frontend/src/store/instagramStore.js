import { create } from 'zustand';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

export const useInstagramStore = create((set, get) => ({
  // State
  instagramImages: [],
  loading: false,
  error: null,
  success: false,
  
  // Reset state
  resetState: () => set({
    loading: false,
    error: null,
    success: false
  }),
  
  // Fetch Instagram images
  fetchInstagramImages: async () => {
    set({ loading: true, error: null });
    
    try {
      console.log('🔄 [InstagramStore] Fetching Instagram images');
      const response = await axios.get(`${apiConfig.baseURL}/instagram`);
      
      if (response.data.success) {
        console.log(`✅ [InstagramStore] Fetched ${response.data.count} Instagram images`);
        set({ instagramImages: response.data.data, loading: false });
      }
    } catch (error) {
      console.error('❌ [InstagramStore] Error fetching Instagram images:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch Instagram images', 
        loading: false 
      });
    }
  },
  
  // Fetch all Instagram images (including inactive ones) - for admin panel
  fetchAllInstagramImages: async () => {
    set({ loading: true, error: null });
    
    try {
      console.log('🔄 [InstagramStore] Fetching all Instagram images');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${apiConfig.baseURL}/instagram?all=true`, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log(`✅ [InstagramStore] Fetched ${response.data.count} Instagram images (admin)`);
        set({ instagramImages: response.data.data, loading: false });
      }
    } catch (error) {
      console.error('❌ [InstagramStore] Error fetching all Instagram images:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch Instagram images', 
        loading: false 
      });
    }
  },
  
  // Create Instagram image
  createInstagramImage: async (imageData) => {
    set({ loading: true, error: null, success: false });
    
    try {
      console.log('🔄 [InstagramStore] Creating Instagram image');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${apiConfig.baseURL}/instagram`, imageData, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ [InstagramStore] Created Instagram image');
        
        // Update the instagramImages state with the new image
        const currentImages = get().instagramImages;
        set({ 
          instagramImages: [...currentImages, response.data.data], 
          loading: false,
          success: true
        });
        
        return response.data.data;
      }
    } catch (error) {
      console.error('❌ [InstagramStore] Error creating Instagram image:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to create Instagram image', 
        loading: false,
        success: false
      });
      
      return null;
    }
  },
  
  // Update Instagram image
  updateInstagramImage: async (id, imageData) => {
    set({ loading: true, error: null, success: false });
    
    try {
      console.log(`🔄 [InstagramStore] Updating Instagram image: ${id}`);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${apiConfig.baseURL}/instagram/${id}`, imageData, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log(`✅ [InstagramStore] Updated Instagram image: ${id}`);
        
        // Update the instagramImages state with the updated image
        const currentImages = get().instagramImages;
        const updatedImages = currentImages.map(img => 
          img._id === id ? response.data.data : img
        );
        
        set({ 
          instagramImages: updatedImages, 
          loading: false,
          success: true
        });
        
        return response.data.data;
      }
    } catch (error) {
      console.error(`❌ [InstagramStore] Error updating Instagram image: ${id}`, error);
      set({ 
        error: error.response?.data?.message || 'Failed to update Instagram image', 
        loading: false,
        success: false
      });
      
      return null;
    }
  },
  
  // Delete Instagram image
  deleteInstagramImage: async (id) => {
    set({ loading: true, error: null, success: false });
    
    try {
      console.log(`🔄 [InstagramStore] Deleting Instagram image: ${id}`);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.delete(`${apiConfig.baseURL}/instagram/${id}`, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log(`✅ [InstagramStore] Deleted Instagram image: ${id}`);
        
        // Update the instagramImages state by removing the deleted image
        const currentImages = get().instagramImages;
        const updatedImages = currentImages.filter(img => img._id !== id);
        
        set({ 
          instagramImages: updatedImages, 
          loading: false,
          success: true
        });
        
        return true;
      }
    } catch (error) {
      console.error(`❌ [InstagramStore] Error deleting Instagram image: ${id}`, error);
      set({ 
        error: error.response?.data?.message || 'Failed to delete Instagram image', 
        loading: false,
        success: false
      });
      
      return false;
    }
  }
})); 