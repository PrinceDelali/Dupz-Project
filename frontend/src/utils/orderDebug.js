import axios from 'axios';
import apiConfig from '../config/apiConfig';

/**
 * Order Testing Utility
 * 
 * This file contains utility functions to test and debug
 * the order creation and retrieval functionality.
 */

// Use apiConfig for API URL instead of hardcoding
const API_URL = apiConfig.baseURL;

/**
 * Get diagnostic information about orders
 */
export const getOrderDiagnostic = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return { error: 'Not authenticated' };
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.get(`${API_URL}/orders/diagnostic`, config);
    console.log('Order diagnostic results:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching order diagnostics:', error);
    return { error: error.message };
  }
};

/**
 * Create a test order for the current user
 */
export const createTestOrder = async () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Must have a token to create a test order
    if (!token) {
      console.error('You must be logged in to create a test order');
      return {
        success: false,
        error: 'Authentication required'
      };
    }
    
    // Set up auth headers
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // This is how auth headers should be set for all API calls
    console.log('Test order auth headers:', config.headers);
    
    // API call
    const response = await axios.post(`${API_URL}/orders/create-test`, {}, config);
    
    console.log('Test order created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating test order:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Fetch current user's orders
 */
export const fetchMyOrders = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return { error: 'Not authenticated' };
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.get(`${API_URL}/orders/my-orders`, config);
    console.log('My orders:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching my orders:', error);
    return { error: error.message };
  }
};

/**
 * Run all tests in sequence
 */
export const runOrderTests = async () => {
  console.log('=== RUNNING ORDER TESTS ===');
  
  // Get current auth state
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('Current user:', user ? `${user.firstName} ${user.lastName} (${user._id})` : 'Not logged in');
  
  // Run tests
  console.log('\n1. Checking order diagnostics...');
  await getOrderDiagnostic();
  
  console.log('\n2. Creating test order...');
  const testOrderResult = await createTestOrder();
  
  console.log('\n3. Fetching user orders again...');
  await fetchMyOrders();
  
  console.log('\n=== TESTS COMPLETE ===');
  return {
    user,
    testOrderCreated: testOrderResult && !testOrderResult.error
  };
};

// Test the authentication mechanism
export const checkAuth = async () => {
  try {
    // Get token from localStorage - exactly how the orders API calls get it
    const token = localStorage.getItem('token');
    
    // Set up headers exactly like the order creation process
    const config = token ? {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    } : {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Auth check headers:', config.headers);
    
    // Call the diagnostic endpoint
    const response = await axios.get(`${API_URL}/orders/auth-check`, config);
    
    console.log('Auth check results:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking auth:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

// Export the default function for easy access in console
export default runOrderTests; 