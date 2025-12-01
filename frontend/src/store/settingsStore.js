import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiConfig from '../config/apiConfig';
import axios from 'axios';

// Helper function to get token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ [settingsStore] No auth token found in localStorage');
    return null;
  }
  return token;
};

// Helper to create authenticated axios instance
const getAuthAxios = () => {
  const token = getAuthToken();
  const instance = axios.create({
    baseURL: apiConfig.baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        console.error('❌ [settingsStore] Authentication failed (401 Unauthorized)');
        // Emit an event that can be caught by AuthContext
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: null,
      shippingMethods: [],
      taxRates: [],
      banners: [],
      defaultTaxRate: 0.15, // Default 15%
      loading: false,
      error: null,
      
      // Get all settings
      fetchSettings: async () => {
        console.log('🔍 [settingsStore] Fetching all settings');
        try {
          set({ loading: true, error: null });
          // Create an axios instance with auth token if available
          const authAxios = getAuthAxios();
          const response = await authAxios.get(`/settings`);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Settings fetched successfully:', response.data.data);
            set({ 
              settings: response.data.data,
              defaultTaxRate: response.data.data.defaultTaxRate || 0.15,
              loading: false 
            });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to fetch settings:', response.data.error);
            set({ error: response.data.error || 'Failed to fetch settings', loading: false });
            return null;
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error fetching settings:', error);
          set({ error: error.message, loading: false });
          return null;
        }
      },
      
      // Get banners
      fetchBanners: async () => {
        console.log('🔍 [settingsStore] Fetching banners');
        try {
          set({ loading: true, error: null });
          const authAxios = getAuthAxios();
          const response = await authAxios.get(`/settings/banners`);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Banners fetched successfully:', response.data.data);
            set({ banners: response.data.data, loading: false });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to fetch banners:', response.data.error);
            set({ error: response.data.error || 'Failed to fetch banners', loading: false });
            return [];
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error fetching banners:', error);
          set({ error: error.message, loading: false });
          
          // Fallback to default banners if API call fails
          return [
            {
              type: 'topBanner',
              imageUrl: 'https://us.princesspolly.com/cdn/shop/files/UpTo70_OffShoes-Feb25-S_NH-HP-Strip-Banner_2_1599x.progressive.jpg?v=1740695249',
              alt: 'Sale Banner',
              linkUrl: '#',
              isActive: true
            },
            {
              type: 'heroBanner',
              imageUrl: 'https://us.princesspolly.com/cdn/shop/files/Group_3312_6cf6ba2e-a5b6-4f66-94c7-70210e935b86_1599x.progressive.jpg?v=1740713873',
              alt: 'Hero Image',
              linkUrl: '#',
              isActive: true
            }
          ];
        }
      },
      
      // Update banners
      updateBanners: async (updatedBanners) => {
        console.log('🔄 [settingsStore] Updating banners:', updatedBanners);
        try {
          set({ loading: true, error: null });
          
          // Validate banners before updating
          if (!Array.isArray(updatedBanners)) {
            throw new Error('Banners must be an array');
          }
          
          // Save a local backup in case the API call fails
          localStorage.setItem('sinosply_banners_backup', JSON.stringify(updatedBanners));
          console.log('💾 [settingsStore] Banners backed up to localStorage before API call');
          
          // Check for authentication token
          const authAxios = getAuthAxios();
          const token = getAuthToken();
          if (!token) {
            console.error('❌ [settingsStore] Authentication token missing, cannot update server. Updating locally only.');
            set({ error: 'Authentication required to update banners on server', loading: false });
            
            // Still update local state as fallback
            set({ banners: updatedBanners, loading: false });
            return updatedBanners;
          }
          
          const response = await authAxios.put(`/settings/banners`, updatedBanners);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Banners updated successfully:', response.data.data);
            set({ banners: response.data.data, loading: false });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to update banners:', response.data.error);
            set({ error: response.data.error || 'Failed to update banners', loading: false });
            
            // If API call fails, update the local state anyway
            console.log('⚠️ [settingsStore] Updating local banners state despite API failure');
            set({ banners: updatedBanners, loading: false });
            return updatedBanners;
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error updating banners:', error.response?.data?.message || error.message);
          set({ error: error.response?.data?.message || error.message, loading: false });
          
          // If there's a serious error, still update the local state if possible
          if (Array.isArray(updatedBanners) && updatedBanners.length > 0) {
            console.log('⚠️ [settingsStore] Updating local banners state despite error');
            set({ banners: updatedBanners, loading: false });
            return updatedBanners;
          }
          
          return null;
        }
      },
      
      // Update specific banner by type
      updateBannerByType: async (type, bannerData) => {
        console.log(`🔄 [settingsStore] Updating ${type} banner:`, bannerData);
        try {
          set({ loading: true, error: null });
          
          if (!bannerData || !bannerData.imageUrl) {
            throw new Error('Banner data must include imageUrl');
          }
          
          // Save a local backup of the current banners
          const currentBanners = get().banners;
          localStorage.setItem('sinosply_banners_backup', JSON.stringify(currentBanners));
          
          // Check for authentication token
          const authAxios = getAuthAxios();
          const token = getAuthToken();
          if (!token) {
            console.error('❌ [settingsStore] Authentication token missing, cannot update server. Updating locally only.');
            set({ error: 'Authentication required to update banner on server', loading: false });
            
            // Update local state as fallback
            const updatedBanners = [...currentBanners];
            const bannerIndex = updatedBanners.findIndex(banner => banner.type === type);
            
            if (bannerIndex >= 0) {
              updatedBanners[bannerIndex] = { ...updatedBanners[bannerIndex], ...bannerData, type };
            } else {
              updatedBanners.push({ type, ...bannerData });
            }
            
            set({ banners: updatedBanners, loading: false });
            return { type, ...bannerData };
          }
          
          const response = await authAxios.put(`/settings/banners/${type}`, bannerData);
          
          if (response.data.success) {
            console.log(`✅ [settingsStore] ${type} banner updated successfully:`, response.data.data);
            
            // Update local banners state
            const updatedBanners = [...currentBanners];
            const bannerIndex = updatedBanners.findIndex(banner => banner.type === type);
            
            if (bannerIndex >= 0) {
              updatedBanners[bannerIndex] = response.data.data;
            } else {
              updatedBanners.push(response.data.data);
            }
            
            set({ banners: updatedBanners, loading: false });
            return response.data.data;
          } else {
            console.error(`❌ [settingsStore] Failed to update ${type} banner:`, response.data.error);
            set({ error: response.data.error || `Failed to update ${type} banner`, loading: false });
            return null;
          }
        } catch (error) {
          console.error(`❌ [settingsStore] Error updating ${type} banner:`, error.response?.data?.message || error.message);
          set({ error: error.response?.data?.message || error.message, loading: false });
          return null;
        }
      },
      
      // Get banner by type
      getBannerByType: (type) => {
        const { banners } = get();
        return banners.find(banner => banner.type === type && banner.isActive) || null;
      },
      
      // Get shipping methods
      fetchShippingMethods: async () => {
        console.log('🔍 [settingsStore] Fetching shipping methods');
        try {
          set({ loading: true, error: null });
          // Create an axios instance with auth token if available
          const authAxios = getAuthAxios();
          const response = await authAxios.get(`/settings/shipping`);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Shipping methods fetched successfully:', response.data.data);
            set({ shippingMethods: response.data.data, loading: false });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to fetch shipping methods:', response.data.error);
            set({ error: response.data.error || 'Failed to fetch shipping methods', loading: false });
            return [];
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error fetching shipping methods:', error);
          set({ error: error.message, loading: false });
          
          // Fallback to using cached shipping methods if available
          const cachedMethods = get().shippingMethods;
          if (cachedMethods && cachedMethods.length > 0) {
            console.log('⚠️ [settingsStore] Using cached shipping methods');
            return cachedMethods;
          }
          
          // Return default shipping methods if nothing is available
          console.log('⚠️ [settingsStore] Using default shipping methods');
          return [
            {
              id: 'standard',
              name: 'Standard Shipping',
              description: '3-5 business days',
              price: 5.99,
              carrier: 'DHL',
              estimatedDelivery: '3-5 business days',
              isActive: true
            },
            {
              id: 'express',
              name: 'Express Shipping',
              description: '1-2 business days',
              price: 14.99,
              carrier: 'FedEx',
              estimatedDelivery: '1-2 business days',
              isActive: true
            }
          ];
        }
      },
      
      // Get tax rates
      fetchTaxRates: async () => {
        console.log('🔍 [settingsStore] Fetching tax rates');
        try {
          set({ loading: true, error: null });
          // Create an axios instance with auth token if available
          const authAxios = getAuthAxios();
          const response = await authAxios.get(`/settings/tax`);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Tax rates fetched successfully:', response.data.data);
            set({ taxRates: response.data.data, loading: false });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to fetch tax rates:', response.data.error);
            set({ error: response.data.error || 'Failed to fetch tax rates', loading: false });
            return [];
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error fetching tax rates:', error);
          set({ error: error.message, loading: false });
          
          // Fallback to using cached tax rates if available
          const cachedRates = get().taxRates;
          if (cachedRates && cachedRates.length > 0) {
            console.log('⚠️ [settingsStore] Using cached tax rates');
            return cachedRates;
          }
          
          return [];
        }
      },
      
      // Update settings (admin only)
      updateSettings: async (updatedSettings) => {
        console.log('🔄 [settingsStore] Updating settings:', updatedSettings);
        try {
          set({ loading: true, error: null });
          
          // Check for authentication token
          const authAxios = getAuthAxios();
          if (!getAuthToken()) {
            console.error('❌ [settingsStore] Authentication token missing, cannot update settings');
            set({ error: 'Authentication required to update settings', loading: false });
            return null;
          }
          
          const response = await authAxios.put(`/settings`, updatedSettings);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Settings updated successfully:', response.data.data);
            set({ 
              settings: response.data.data,
              defaultTaxRate: response.data.data.defaultTaxRate || get().defaultTaxRate,
              loading: false 
            });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to update settings:', response.data.error);
            set({ error: response.data.error || 'Failed to update settings', loading: false });
            return null;
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error updating settings:', error.response?.data?.message || error.message);
          if (error.response?.status === 401) {
            set({ error: 'Authentication failed - please log in again', loading: false });
          } else {
            set({ error: error.response?.data?.message || error.message, loading: false });
          }
          return null;
        }
      },
      
      // Update shipping methods (admin only)
      updateShippingMethods: async (updatedMethods) => {
        console.log('🔄 [settingsStore] Updating shipping methods:', updatedMethods);
        try {
          set({ loading: true, error: null });
          
          // Validate shipping methods before updating
          if (!Array.isArray(updatedMethods)) {
            throw new Error('Shipping methods must be an array');
          }
          
          // Ensure all required fields are present
          const validatedMethods = updatedMethods.map(method => {
            if (!method.id) {
              method.id = `shipping-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              console.warn('⚠️ [settingsStore] Generated missing ID for shipping method:', method.id);
            }
            
            if (!method.name) {
              method.name = 'Unnamed Shipping Method';
              console.warn('⚠️ [settingsStore] Added default name for shipping method:', method.id);
            }
            
            if (typeof method.price !== 'number') {
              method.price = parseFloat(method.price) || 0;
              console.warn('⚠️ [settingsStore] Converted price to number for shipping method:', method.id);
            }
            
            return method;
          });
          
          // Save a local backup in case the API call fails
          localStorage.setItem('sinosply_shipping_backup', JSON.stringify(validatedMethods));
          console.log('💾 [settingsStore] Shipping methods backed up to localStorage before API call');
          
          // Check for authentication token
          const authAxios = getAuthAxios();
          const token = getAuthToken();
          if (!token) {
            console.error('❌ [settingsStore] Authentication token missing, cannot update server. Updating locally only.');
            set({ error: 'Authentication required to update shipping methods on server', loading: false });
            
            // Still update local state as fallback
            set({ shippingMethods: validatedMethods, loading: false });
            return validatedMethods;
          }
          
          const response = await authAxios.put(`/settings/shipping`, validatedMethods);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Shipping methods updated successfully:', response.data.data);
            set({ shippingMethods: response.data.data, loading: false });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to update shipping methods:', response.data.error);
            set({ error: response.data.error || 'Failed to update shipping methods', loading: false });
            
            // If API call fails but we have validated methods, update the local state anyway
            console.log('⚠️ [settingsStore] Updating local shipping methods state despite API failure');
            set({ shippingMethods: validatedMethods, loading: false });
            return validatedMethods;
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error updating shipping methods:', error.response?.data?.message || error.message);
          set({ error: error.response?.data?.message || error.message, loading: false });
          
          // If there's a serious error, still update the local state if possible
          if (Array.isArray(updatedMethods) && updatedMethods.length > 0) {
            console.log('⚠️ [settingsStore] Updating local shipping methods state despite error');
            set({ shippingMethods: updatedMethods, loading: false });
            return updatedMethods;
          }
          
          return null;
        }
      },
      
      // Update tax rates (admin only)
      updateTaxRates: async (updatedRates) => {
        console.log('🔄 [settingsStore] Updating tax rates:', updatedRates);
        try {
          set({ loading: true, error: null });
          
          // Validate tax rates before updating
          if (!Array.isArray(updatedRates)) {
            throw new Error('Tax rates must be an array');
          }
          
          // Ensure all required fields are present
          const validatedRates = updatedRates.map(rate => {
            if (!rate.countryCode) {
              rate.countryCode = 'XX';
              console.warn('⚠️ [settingsStore] Added placeholder country code for tax rate');
            }
            
            if (!rate.country) {
              rate.country = 'Unknown Country';
              console.warn('⚠️ [settingsStore] Added placeholder country name for tax rate:', rate.countryCode);
            }
            
            if (typeof rate.rate !== 'number') {
              rate.rate = parseFloat(rate.rate) || get().defaultTaxRate;
              console.warn('⚠️ [settingsStore] Converted rate to number for tax rate:', rate.countryCode);
            }
            
            return rate;
          });
          
          // Save a local backup in case the API call fails
          localStorage.setItem('sinosply_taxrates_backup', JSON.stringify(validatedRates));
          console.log('💾 [settingsStore] Tax rates backed up to localStorage before API call');
          
          // Check for authentication token
          const authAxios = getAuthAxios();
          const token = getAuthToken();
          if (!token) {
            console.error('❌ [settingsStore] Authentication token missing, cannot update server. Updating locally only.');
            set({ error: 'Authentication required to update tax rates on server', loading: false });
            
            // Still update local state as fallback
            set({ taxRates: validatedRates, loading: false });
            return validatedRates;
          }
          
          const response = await authAxios.put(`/settings/tax`, validatedRates);
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Tax rates updated successfully:', response.data.data);
            set({ taxRates: response.data.data, loading: false });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to update tax rates:', response.data.error);
            set({ error: response.data.error || 'Failed to update tax rates', loading: false });
            
            // If API call fails but we have validated rates, update the local state anyway
            console.log('⚠️ [settingsStore] Updating local tax rates state despite API failure');
            set({ taxRates: validatedRates, loading: false });
            return validatedRates;
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error updating tax rates:', error.response?.data?.message || error.message);
          set({ error: error.response?.data?.message || error.message, loading: false });
          
          // If there's a serious error, still update the local state if possible
          if (Array.isArray(updatedRates) && updatedRates.length > 0) {
            console.log('⚠️ [settingsStore] Updating local tax rates state despite error');
            set({ taxRates: updatedRates, loading: false });
            return updatedRates;
          }
          
          return null;
        }
      },
      
      // Update default tax rate (admin only)
      updateDefaultTaxRate: async (rate) => {
        console.log('🔄 [settingsStore] Updating default tax rate:', rate);
        try {
          set({ loading: true, error: null });
          
          // Validate rate
          let validatedRate = rate;
          if (typeof validatedRate !== 'number') {
            validatedRate = parseFloat(validatedRate) || 0.15;
            console.warn('⚠️ [settingsStore] Converted default tax rate to number:', validatedRate);
          }
          
          // Ensure rate is between 0 and 1
          if (validatedRate > 1) {
            validatedRate = validatedRate / 100;
            console.warn('⚠️ [settingsStore] Converted percentage to decimal for default tax rate:', validatedRate);
          }
          
          // Save a local backup in case the API call fails
          localStorage.setItem('sinosply_default_tax_rate', validatedRate.toString());
          console.log('💾 [settingsStore] Default tax rate backed up to localStorage before API call');
          
          // Check for authentication token
          const authAxios = getAuthAxios();
          const token = getAuthToken();
          if (!token) {
            console.error('❌ [settingsStore] Authentication token missing, cannot update server. Updating locally only.');
            set({ error: 'Authentication required to update default tax rate on server', loading: false });
            
            // Still update local state as fallback
            set({ defaultTaxRate: validatedRate, loading: false });
            return { defaultTaxRate: validatedRate };
          }
          
          const response = await authAxios.put(`/settings/tax/default`, { defaultTaxRate: validatedRate });
          
          if (response.data.success) {
            console.log('✅ [settingsStore] Default tax rate updated successfully:', response.data.data.defaultTaxRate);
            set({ defaultTaxRate: response.data.data.defaultTaxRate, loading: false });
            return response.data.data;
          } else {
            console.error('❌ [settingsStore] Failed to update default tax rate:', response.data.error);
            set({ error: response.data.error || 'Failed to update default tax rate', loading: false });
            
            // If API call fails, update the local state anyway
            console.log('⚠️ [settingsStore] Updating local default tax rate despite API failure');
            set({ defaultTaxRate: validatedRate, loading: false });
            return { defaultTaxRate: validatedRate };
          }
        } catch (error) {
          console.error('❌ [settingsStore] Error updating default tax rate:', error.response?.data?.message || error.message);
          set({ error: error.response?.data?.message || error.message, loading: false });
          
          // If there's a serious error, still update the local state
          console.log('⚠️ [settingsStore] Updating local default tax rate despite error');
          set({ defaultTaxRate: rate, loading: false });
          return { defaultTaxRate: rate };
        }
      },
      
      // Get tax rate for specific country
      getTaxRateForCountry: (countryCode) => {
        console.log('🔍 [settingsStore] Getting tax rate for country:', countryCode);
        const { taxRates, defaultTaxRate } = get();
        const taxRate = taxRates.find(rate => rate.countryCode === countryCode && rate.isActive);
        
        if (taxRate) {
          console.log(`✅ [settingsStore] Found tax rate for ${countryCode}:`, taxRate.rate);
          return taxRate.rate;
        } else {
          console.log(`⚠️ [settingsStore] No tax rate found for ${countryCode}, using default:`, defaultTaxRate);
          return defaultTaxRate;
        }
      },
      
      // Try to recover settings from localStorage backups
      recoverSettings: () => {
        console.log('🔄 [settingsStore] Attempting to recover settings from localStorage backups');
        
        try {
          // Recover shipping methods
          const shippingBackup = localStorage.getItem('sinosply_shipping_backup');
          if (shippingBackup) {
            const parsedShipping = JSON.parse(shippingBackup);
            if (Array.isArray(parsedShipping) && parsedShipping.length > 0) {
              console.log('✅ [settingsStore] Recovered shipping methods from backup:', parsedShipping);
              set({ shippingMethods: parsedShipping });
            }
          }
          
          // Recover tax rates
          const taxRatesBackup = localStorage.getItem('sinosply_taxrates_backup');
          if (taxRatesBackup) {
            const parsedTaxRates = JSON.parse(taxRatesBackup);
            if (Array.isArray(parsedTaxRates) && parsedTaxRates.length > 0) {
              console.log('✅ [settingsStore] Recovered tax rates from backup:', parsedTaxRates);
              set({ taxRates: parsedTaxRates });
            }
          }
          
          // Recover default tax rate
          const defaultTaxRateBackup = localStorage.getItem('sinosply_default_tax_rate');
          if (defaultTaxRateBackup) {
            const parsedRate = parseFloat(defaultTaxRateBackup);
            if (!isNaN(parsedRate)) {
              console.log('✅ [settingsStore] Recovered default tax rate from backup:', parsedRate);
              set({ defaultTaxRate: parsedRate });
            }
          }
          
          // Recover banners
          const bannersBackup = localStorage.getItem('sinosply_banners_backup');
          if (bannersBackup) {
            const parsedBanners = JSON.parse(bannersBackup);
            if (Array.isArray(parsedBanners) && parsedBanners.length > 0) {
              console.log('✅ [settingsStore] Recovered banners from backup:', parsedBanners);
              set({ banners: parsedBanners });
            }
          }
          
          return true;
        } catch (error) {
          console.error('❌ [settingsStore] Error recovering settings from backups:', error);
          return false;
        }
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Reset state
      resetState: () => set({
        settings: null,
        shippingMethods: [],
        taxRates: [],
        banners: [],
        defaultTaxRate: 0.15,
        loading: false,
        error: null
      })
    }),
    {
      name: 'sinosply-settings',
      partialize: (state) => ({
        defaultTaxRate: state.defaultTaxRate,
        shippingMethods: state.shippingMethods,
        taxRates: state.taxRates,
        banners: state.banners
      })
    }
  )
); 