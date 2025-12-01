/**
 * API Configuration
 * 
 * This file contains configuration for API endpoints.
 * It handles different environments (development, production)
 * and provides a consistent baseURL for API requests.
 */

const getBaseURL = () => {
  // Check if we have a VITE_API_URL in environment variables
  if (import.meta.env.VITE_API_URL) {
    console.log('Using API URL from environment:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Determine if we're in development or production
  const isDevelopment = !import.meta.env.PROD;
  console.log('Environment:', isDevelopment ? 'Development' : 'Production');
  
  // Check if we're on the main domain
  const isMainDomain = window.location.hostname === 'www.sinosply.com' || 
                       window.location.hostname === 'sinosply.com';
  
  // Fall back to default URLs based on environment
  if (!isDevelopment) {
    if (isMainDomain) {
      // For main domain
      console.log('Using production API URL for main domain: https://sinosply-backend.onrender.com/api/v1');
      return 'https://sinosply-backend.onrender.com/api/v1';
    }
    // For other production environments (like bunnyandwolf.vercel.app)
    console.log('Using production API URL: https://sinosply-backend.onrender.com/api/v1');
    return 'https://sinosply-backend.onrender.com/api/v1';
  } else {
    // For development
    console.log('Using development API URL: http://localhost:5000/api/v1');
    return 'http://localhost:5000/api/v1';
  }
};

const apiConfig = {
  baseURL: getBaseURL(),
  
  // Default request timeout
  timeout: 30000, // 30 seconds
  
  // Rate limiting settings (requests per minute)
  rateLimit: 60,
  
  // Endpoints
  endpoints: {
    auth: '/auth',
    products: '/products',
    orders: '/orders',
    users: '/users',
    cart: '/cart',
    wishlist: '/wishlist',
    contact: '/contact',
    quote: '/quote',
    search: '/search',
    aiSearch: '/search/ai',
    reports: '/admin/reports/generate'
  },
  
  // Default headers for all requests
  headers: {
    'Content-Type': 'application/json'
  },
  
  // Get auth token from localStorage
  getAuthHeader: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  
  // Upload configuration
  upload: {
    // Maximum file size for uploads in bytes (5MB)
    maxFileSize: 5 * 1024 * 1024,
    // Maximum image dimensions for auto-resizing
    maxImageWidth: 1200,
    maxImageHeight: 1200,
    // Image compression quality (0-1)
    imageQuality: 0.8,
    // Accepted file types
    acceptedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    // Function to check if file is too large
    isFileTooLarge: (file) => file.size > apiConfig.upload.maxFileSize,
    // Function to format file size for display
    formatFileSize: (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
      else return (bytes / 1048576).toFixed(2) + ' MB';
    }
  }
};

export default apiConfig; 