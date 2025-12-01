import { create } from 'zustand';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

export const useReviewStore = create((set, get) => ({
  // Reviews for current product
  reviews: [],
  // Review statistics for current product
  reviewStats: null,
  // Loading states
  loading: false,
  submitting: false,
  error: null,
  // Pagination
  pagination: {
    page: 1,
    limit: 5,
    totalPages: 1,
    total: 0
  },
  // Sort options
  sortBy: 'newest',
  
  // Fetch reviews for a product
  fetchProductReviews: async (productId, page = 1, sort = 'newest', limit = 5) => {
    if (!productId) return;
    
    set({ loading: true, error: null });
    try {
      // This is a public endpoint, so we don't need to include auth headers
      const response = await axios.get(
        `${apiConfig.baseURL}/products/${productId}/reviews?page=${page}&limit=${limit}&sort=${sort}`
      );
      
      if (response.data.success) {
        set({
          reviews: response.data.data,
          reviewStats: response.data.stats,
          pagination: {
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            totalPages: response.data.pagination.totalPages,
            total: response.data.total
          },
          sortBy: sort
        });
      } else {
        set({ error: response.data.message || 'Failed to fetch reviews' });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Handle errors silently, don't trigger auth errors
      set({ 
        error: 'Failed to load reviews',
        reviews: [],
        reviewStats: null,
        pagination: {
          page: 1,
          limit: 5,
          totalPages: 1,
          total: 0
        }
      });
    } finally {
      set({ loading: false });
    }
  },
  
  // Create a new review
  createReview: async (productId, reviewData) => {
    set({ submitting: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ error: 'Please log in to submit a review', submitting: false });
        return { success: false, message: 'Authentication required' };
      }
      
      const response = await axios.post(
        `${apiConfig.baseURL}/products/${productId}/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Refresh reviews to get the updated list
        await get().fetchProductReviews(productId, 1, get().sortBy);
        return { success: true };
      } else {
        set({ error: response.data.message || 'Failed to submit review' });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error creating review:', error);
      set({ error: error.response?.data?.message || 'Failed to submit review' });
      return { success: false, message: error.response?.data?.message || 'Error submitting review' };
    } finally {
      set({ submitting: false });
    }
  },
  
  // Update a review
  updateReview: async (reviewId, reviewData) => {
    set({ submitting: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ error: 'Please log in to update a review', submitting: false });
        return { success: false, message: 'Authentication required' };
      }
      
      const response = await axios.put(
        `${apiConfig.baseURL}/reviews/${reviewId}`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update the review in state
        set(state => ({
          reviews: state.reviews.map(review => 
            review._id === reviewId ? { ...review, ...response.data.data } : review
          )
        }));
        return { success: true };
      } else {
        set({ error: response.data.message || 'Failed to update review' });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error updating review:', error);
      set({ error: error.response?.data?.message || 'Failed to update review' });
      return { success: false, message: error.response?.data?.message || 'Error updating review' };
    } finally {
      set({ submitting: false });
    }
  },
  
  // Delete a review
  deleteReview: async (reviewId, productId) => {
    set({ submitting: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        set({ error: 'Please log in to delete a review', submitting: false });
        return { success: false, message: 'Authentication required' };
      }
      
      const response = await axios.delete(
        `${apiConfig.baseURL}/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Refresh reviews to get the updated list
        if (productId) {
          await get().fetchProductReviews(productId, 1, get().sortBy);
        } else {
          // Remove from state if product ID not provided
          set(state => ({
            reviews: state.reviews.filter(review => review._id !== reviewId)
          }));
        }
        return { success: true };
      } else {
        set({ error: response.data.message || 'Failed to delete review' });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      set({ error: error.response?.data?.message || 'Failed to delete review' });
      return { success: false, message: error.response?.data?.message || 'Error deleting review' };
    } finally {
      set({ submitting: false });
    }
  },
  
  // Vote on a review
  voteOnReview: async (reviewId, voteType) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ error: 'Please log in to vote on reviews' });
      return { success: false, message: 'Authentication required' };
    }
    
    try {
      const response = await axios.post(
        `${apiConfig.baseURL}/reviews/${reviewId}/vote`,
        { voteType },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update the review in state
        set(state => ({
          reviews: state.reviews.map(review => 
            review._id === reviewId 
              ? { 
                  ...review, 
                  helpfulVotes: response.data.data.helpfulVotes,
                  unhelpfulVotes: response.data.data.unhelpfulVotes 
                } 
              : review
          )
        }));
        return { success: true };
      } else {
        set({ error: response.data.message || 'Failed to vote on review' });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error voting on review:', error);
      set({ error: error.response?.data?.message || 'Failed to vote on review' });
      return { success: false, message: error.response?.data?.message || 'Error voting on review' };
    }
  },
  
  // Add a reply to a review
  addReply: async (reviewId, content) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ error: 'Please log in to reply to reviews' });
      return { success: false, message: 'Authentication required' };
    }
    
    try {
      const response = await axios.post(
        `${apiConfig.baseURL}/reviews/${reviewId}/replies`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Add the reply to the review in state
        set(state => ({
          reviews: state.reviews.map(review => 
            review._id === reviewId 
              ? { 
                  ...review, 
                  replies: [...(review.replies || []), response.data.data]
                } 
              : review
          )
        }));
        return { success: true };
      } else {
        set({ error: response.data.message || 'Failed to add reply' });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      set({ error: error.response?.data?.message || 'Failed to add reply' });
      return { success: false, message: error.response?.data?.message || 'Error adding reply' };
    }
  },
  
  // Vote on a reply
  voteOnReply: async (reviewId, replyId, voteType) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ error: 'Please log in to vote on replies' });
      return { success: false, message: 'Authentication required' };
    }
    
    try {
      const response = await axios.post(
        `${apiConfig.baseURL}/reviews/${reviewId}/replies/${replyId}/vote`,
        { voteType },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update the reply in state
        set(state => ({
          reviews: state.reviews.map(review => 
            review._id === reviewId 
              ? { 
                  ...review, 
                  replies: (review.replies || []).map(reply => 
                    reply._id === replyId
                      ? {
                          ...reply,
                          helpfulVotes: response.data.data.helpfulVotes,
                          unhelpfulVotes: response.data.data.unhelpfulVotes
                        }
                      : reply
                  )
                } 
              : review
          )
        }));
        return { success: true };
      } else {
        set({ error: response.data.message || 'Failed to vote on reply' });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error voting on reply:', error);
      set({ error: error.response?.data?.message || 'Failed to vote on reply' });
      return { success: false, message: error.response?.data?.message || 'Error voting on reply' };
    }
  },
  
  // Clear errors
  clearError: () => set({ error: null }),
  
  // Reset store
  resetStore: () => set({
    reviews: [],
    reviewStats: null,
    loading: false,
    submitting: false,
    error: null,
    pagination: {
      page: 1,
      limit: 5,
      totalPages: 1,
      total: 0
    },
    sortBy: 'newest'
  })
})); 