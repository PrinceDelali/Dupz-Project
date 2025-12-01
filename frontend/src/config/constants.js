// API URLs - use apiConfig.baseURL instead of hardcoding here
import apiConfig from './apiConfig';
export const API_BASE_URL = apiConfig.baseURL;

// Fixed values
export const LOW_STOCK_THRESHOLD = 10;
export const CRITICAL_STOCK_THRESHOLD = 5;

// Image placeholders  
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400?text=No+Image';
export const PLACEHOLDER_THUMBNAIL = 'https://via.placeholder.com/100?text=No+Image';

// Currency symbol
export const CURRENCY_SYMBOL = 'GH₵';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  CART: 'cart',
  WISHLIST: 'wishlist',
  COUPONS: 'sinosply_coupons'
}; 