import { create } from 'zustand';
import axios from 'axios';
import apiConfig from '../config/apiConfig';
// Import ToastManager only when needed, not at the store level

// Use apiConfig for API URL
const apiUrl = apiConfig.baseURL;

const useCouponStore = create((set, get) => ({
  coupons: [],
  loading: false,
  error: null,
  activeCoupon: null,
  
  // Fetch all coupons
  fetchCoupons: async () => {
    try {
      set({ loading: true, error: null });
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ 
          loading: false, 
          error: 'Authentication required. Please login first.' 
        });
        return { success: false };
      }
      
      const response = await axios.get(`${apiUrl}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        set({ 
          coupons: response.data.data,
          loading: false 
        });
        return { success: true, data: response.data.data };
      } else {
        set({ 
          loading: false, 
          error: response.data.message || 'Failed to fetch coupons' 
        });
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error fetching coupons';
      set({ 
        loading: false, 
        error: errorMessage 
      });
      
      // Initialize with sample data as fallback
      const sampleCoupons = get().getSampleCoupons();
      set({ coupons: sampleCoupons });
      
      // Save to localStorage for persistence
      localStorage.setItem('sinosply_coupons', JSON.stringify(sampleCoupons));
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Create a new coupon
  createCoupon: async (couponData) => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Authentication required' });
        return { success: false };
      }
      
      const response = await axios.post(
        `${apiUrl}/admin/coupons`, 
        couponData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Add the new coupon to the store
        set(state => ({ 
          coupons: [...state.coupons, response.data.data],
          loading: false 
        }));
        
        // Also update localStorage
        const updatedCoupons = [...get().coupons];
        localStorage.setItem('sinosply_coupons', JSON.stringify(updatedCoupons));
        
        return { success: true, data: response.data.data };
      } else {
        set({ 
          loading: false, 
          error: response.data.message || 'Failed to create coupon' 
        });
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error creating coupon';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Update an existing coupon
  updateCoupon: async (id, couponData) => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Authentication required' });
        return { success: false };
      }
      
      const response = await axios.put(
        `${apiUrl}/admin/coupons/${id}`, 
        couponData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update the coupon in the store
        set(state => ({ 
          coupons: state.coupons.map(c => 
            c._id === id ? response.data.data : c
          ),
          loading: false 
        }));
        
        // Also update localStorage
        const updatedCoupons = get().coupons;
        localStorage.setItem('sinosply_coupons', JSON.stringify(updatedCoupons));
        
        return { success: true, data: response.data.data };
      } else {
        set({ 
          loading: false, 
          error: response.data.message || 'Failed to update coupon' 
        });
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error updating coupon';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Delete a coupon
  deleteCoupon: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Authentication required' });
        return { success: false };
      }
      
      const response = await axios.delete(
        `${apiUrl}/admin/coupons/${id}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Remove the coupon from the store
        set(state => ({ 
          coupons: state.coupons.filter(c => c._id !== id),
          loading: false 
        }));
        
        // Also update localStorage
        const updatedCoupons = get().coupons;
        localStorage.setItem('sinosply_coupons', JSON.stringify(updatedCoupons));
        
        return { success: true };
      } else {
        set({ 
          loading: false, 
          error: response.data.message || 'Failed to delete coupon' 
        });
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error deleting coupon';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Toggle coupon activation status
  toggleCouponStatus: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Authentication required' });
        return { success: false };
      }
      
      const response = await axios.patch(
        `${apiUrl}/admin/coupons/${id}/toggle-status`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update the coupon in the store
        set(state => ({ 
          coupons: state.coupons.map(c => 
            c._id === id ? response.data.data : c
          ),
          loading: false 
        }));
        
        // Also update localStorage
        const updatedCoupons = get().coupons;
        localStorage.setItem('sinosply_coupons', JSON.stringify(updatedCoupons));
        
        return { success: true, data: response.data.data };
      } else {
        set({ 
          loading: false, 
          error: response.data.message || 'Failed to toggle coupon status' 
        });
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error toggling coupon status';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Validate a coupon code (for checkout)
  validateCoupon: async (code, totalAmount) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.post(`${apiUrl}/coupons/validate`, {
        code,
        totalAmount
      });
      
      if (response.data.success) {
        set({ 
          activeCoupon: response.data.data.coupon,
          loading: false 
        });
        return { 
          success: true, 
          data: response.data.data,
          discount: response.data.data.discount
        };
      } else {
        set({ 
          loading: false, 
          error: response.data.message || 'Invalid coupon code',
          activeCoupon: null
        });
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error validating coupon';
      set({ 
        loading: false, 
        error: errorMessage,
        activeCoupon: null
      });
      return { success: false, error: errorMessage };
    }
  },
  
  // Apply a coupon (increment usage count)
  applyCoupon: async (couponId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }
      
      const response = await axios.post(
        `${apiUrl}/coupons/apply`, 
        { couponId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update the coupon in the store if it exists
        set(state => ({ 
          coupons: state.coupons.map(c => 
            c._id === couponId ? response.data.data : c
          )
        }));
        
        // Also update localStorage
        const updatedCoupons = get().coupons;
        localStorage.setItem('sinosply_coupons', JSON.stringify(updatedCoupons));
        
        return { success: true };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error applying coupon'
      };
    }
  },
  
  // Provide sample data for fallback
  getSampleCoupons: () => {
    return [
      {
        _id: '1',
        code: 'SUMMER25',
        discountType: 'percentage',
        discountValue: 25,
        minPurchaseAmount: 100,
        maxDiscountAmount: 50,
        startDate: '2023-06-01',
        endDate: '2023-12-31',
        isActive: true,
        usageLimit: 1000,
        usageCount: 423,
        description: 'Summer sale discount'
      },
      {
        _id: '2',
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchaseAmount: 0,
        maxDiscountAmount: null,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        isActive: true,
        usageLimit: null,
        usageCount: 1245,
        description: 'New customer welcome discount'
      },
      {
        _id: '3',
        code: 'FREESHIP',
        discountType: 'fixed',
        discountValue: 15,
        minPurchaseAmount: 75,
        maxDiscountAmount: 15,
        startDate: '2023-05-15',
        endDate: '2023-12-31',
        isActive: true,
        usageLimit: null,
        usageCount: 892,
        description: 'Free shipping on orders over GH₵75'
      }
    ];
  },
  
  // Clear active coupon
  clearActiveCoupon: () => set({ activeCoupon: null }),
  
  // Reset error state
  clearError: () => set({ error: null })
}));

export { useCouponStore }; 