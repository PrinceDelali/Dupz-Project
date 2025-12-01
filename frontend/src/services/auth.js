import axios from 'axios';
import apiConfig from '../config/apiConfig';

const API_URL = apiConfig.baseURL;

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'An error occurred during registration';
  }
};

export const login = async (email, password) => {
  try {
    console.log('🔄 Login request initiated to:', `${API_URL}/auth/login`);
    console.log('📦 Request body:', { email, password: '********' });
    
    const response = await axios.post(`${API_URL}/auth/login`, { email, password }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('❌ Network error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    });
    
    console.log('✅ Login response successful:', {
      success: response.data.success,
      status: response.status,
      hasToken: !!response.data.token,
      hasUser: !!response.data.user
    });
    
    // Store token in local storage if remember me is checked
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('💾 Auth data stored in localStorage');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Login error:', { 
      message: error.message, 
      response: error.response?.data,
      status: error.response?.status
    });
    if (error.response?.data?.error) {
      console.error('📄 Server error message:', error.response.data.error);
    }
    throw error.response?.data?.error || 'Invalid credentials';
  }
};

export const socialAuth = async (provider) => {
  try {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Extract the base domain without the /api/v1 path
    const baseUrl = apiConfig.baseURL.replace('/api/v1', '');
    
    return new Promise((resolve, reject) => {
      const popup = window.open(
        `${baseUrl}/api/v1/auth/${provider}`,
        'Social Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Handle popup blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        reject(new Error('Popup blocked! Please allow popups for this site.'));
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);

      // Use the domain from our config
      const expectedOrigin = new URL(baseUrl).origin;
      
      window.addEventListener('message', function(event) {
        if (event.origin !== expectedOrigin) return;
        
        clearInterval(timer);
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
        
        popup.close();
      }, { once: true });
    });
  } catch (error) {
    throw new Error(`${provider} authentication failed: ${error.message}`);
  }
}; 