import { create } from 'zustand';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

export const useSocialStore = create((set, get) => ({
  // State
  socialLinks: [],
  loading: false,
  error: null,
  success: false,
  
  // Default social links for fallback when none are configured
  defaultSocialLinks: [
    { platform: 'instagram', url: 'https://www.instagram.com/sinosply', displayName: 'Instagram', icon: 'FaInstagram' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@sinosply', displayName: 'TikTok', icon: 'FaTiktok' },
    { platform: 'facebook', url: 'https://www.facebook.com/sinosply', displayName: 'Facebook', icon: 'FaFacebookF' },
    { platform: 'snapchat', url: 'https://www.snapchat.com/add/sinosply', displayName: 'Snapchat', icon: 'FaSnapchatGhost' },
    { platform: 'youtube', url: 'https://www.youtube.com/c/sinosply', displayName: 'YouTube', icon: 'FaYoutube' },
    { platform: 'pinterest', url: 'https://www.pinterest.com/sinosply', displayName: 'Pinterest', icon: 'FaPinterestP' }
  ],
  
  // Reset state
  resetState: () => set({
    loading: false,
    error: null,
    success: false
  }),
  
  // Get active social links with fallback to defaults if none exist
  getActiveSocialLinks: () => {
    const { socialLinks, defaultSocialLinks } = get();
    
    if (socialLinks && socialLinks.length > 0) {
      return socialLinks.filter(link => link.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
    }
    
    return defaultSocialLinks;
  },
  
  // Fetch social links
  fetchSocialLinks: async () => {
    set({ loading: true, error: null });
    
    try {
      console.log('🔄 [SocialStore] Fetching social links');
      const response = await axios.get(`${apiConfig.baseURL}/social`);
      
      if (response.data.success) {
        console.log(`✅ [SocialStore] Fetched ${response.data.count} social links`);
        set({ socialLinks: response.data.data, loading: false });
      }
    } catch (error) {
      console.error('❌ [SocialStore] Error fetching social links:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch social links', 
        loading: false 
      });
    }
  },
  
  // Fetch all social links (including inactive ones) - for admin panel
  fetchAllSocialLinks: async () => {
    set({ loading: true, error: null });
    
    try {
      console.log('🔄 [SocialStore] Fetching all social links');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${apiConfig.baseURL}/social?all=true`, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log(`✅ [SocialStore] Fetched ${response.data.count} social links (admin)`);
        set({ socialLinks: response.data.data, loading: false });
      }
    } catch (error) {
      console.error('❌ [SocialStore] Error fetching all social links:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch social links', 
        loading: false 
      });
    }
  },
  
  // Create social link
  createSocialLink: async (linkData) => {
    set({ loading: true, error: null, success: false });
    
    try {
      console.log('🔄 [SocialStore] Creating social link');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${apiConfig.baseURL}/social`, linkData, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ [SocialStore] Created social link');
        
        // Update the socialLinks state with the new link
        const currentLinks = get().socialLinks;
        set({ 
          socialLinks: [...currentLinks, response.data.data], 
          loading: false,
          success: true
        });
        
        return response.data.data;
      }
    } catch (error) {
      console.error('❌ [SocialStore] Error creating social link:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to create social link', 
        loading: false,
        success: false
      });
      
      return null;
    }
  },
  
  // Update social link
  updateSocialLink: async (id, linkData) => {
    set({ loading: true, error: null, success: false });
    
    try {
      console.log(`🔄 [SocialStore] Updating social link: ${id}`);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${apiConfig.baseURL}/social/${id}`, linkData, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log(`✅ [SocialStore] Updated social link: ${id}`);
        
        // Update the socialLinks state with the updated link
        const currentLinks = get().socialLinks;
        const updatedLinks = currentLinks.map(link => 
          link._id === id ? response.data.data : link
        );
        
        set({ 
          socialLinks: updatedLinks, 
          loading: false,
          success: true
        });
        
        return response.data.data;
      }
    } catch (error) {
      console.error(`❌ [SocialStore] Error updating social link: ${id}`, error);
      set({ 
        error: error.response?.data?.message || 'Failed to update social link', 
        loading: false,
        success: false
      });
      
      return null;
    }
  },
  
  // Delete social link
  deleteSocialLink: async (id) => {
    set({ loading: true, error: null, success: false });
    
    try {
      console.log(`🔄 [SocialStore] Deleting social link: ${id}`);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.delete(`${apiConfig.baseURL}/social/${id}`, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log(`✅ [SocialStore] Deleted social link: ${id}`);
        
        // Update the socialLinks state by removing the deleted link
        const currentLinks = get().socialLinks;
        const updatedLinks = currentLinks.filter(link => link._id !== id);
        
        set({ 
          socialLinks: updatedLinks, 
          loading: false,
          success: true
        });
        
        return true;
      }
    } catch (error) {
      console.error(`❌ [SocialStore] Error deleting social link: ${id}`, error);
      set({ 
        error: error.response?.data?.message || 'Failed to delete social link', 
        loading: false,
        success: false
      });
      
      return false;
    }
  }
})); 