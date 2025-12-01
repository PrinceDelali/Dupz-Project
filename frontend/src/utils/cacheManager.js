/**
 * Cache Manager for Sinosply
 * Provides utilities for caching and retrieving data from localStorage
 * with expiry time controls and versioning for cache invalidation
 */

// Default cache duration (in minutes)
const DEFAULT_CACHE_DURATION = 60; // 1 hour

// Cache version - increment this when making breaking changes to cache structure
const CACHE_VERSION = '1.0';

/**
 * Get an item from cache
 * @param {string} key - Cache key
 * @returns {any|null} - The cached data or null if not found/expired
 */
export const getCachedData = (key) => {
  try {
    const cacheKey = `sinosply_cache_${key}`;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (!cachedItem) return null;
    
    const { data, timestamp, version } = JSON.parse(cachedItem);
    
    // Check if cache version matches current version
    if (version !== CACHE_VERSION) {
      console.log(`[CacheManager] Cache version mismatch for ${key}, clearing`);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Check if cache has expired
    const now = new Date().getTime();
    const cacheTime = parseInt(timestamp);
    const cacheDuration = getCacheDuration(key);
    
    if (now - cacheTime > cacheDuration * 60 * 1000) {
      console.log(`[CacheManager] Cache expired for ${key}`);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`[CacheManager] Cache hit for ${key}`);
    return data;
  } catch (error) {
    console.error(`[CacheManager] Error getting cached data for ${key}:`, error);
    return null;
  }
};

/**
 * Set an item in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @returns {boolean} - Whether caching was successful
 */
export const setCachedData = (key, data) => {
  try {
    const cacheKey = `sinosply_cache_${key}`;
    const cacheData = {
      data,
      timestamp: new Date().getTime(),
      version: CACHE_VERSION
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[CacheManager] Cache set for ${key}`);
    return true;
  } catch (error) {
    console.error(`[CacheManager] Error setting cached data for ${key}:`, error);
    return false;
  }
};

/**
 * Clear a specific cache item
 * @param {string} key - Cache key
 */
export const clearCacheItem = (key) => {
  const cacheKey = `sinosply_cache_${key}`;
  localStorage.removeItem(cacheKey);
  console.log(`[CacheManager] Cache cleared for ${key}`);
};

/**
 * Clear all cache items
 */
export const clearAllCache = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sinosply_cache_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('[CacheManager] All cache cleared');
};

/**
 * Get the cache duration for a specific key
 * Different data types may have different optimal cache durations
 * @param {string} key - Cache key
 * @returns {number} - Cache duration in minutes
 */
const getCacheDuration = (key) => {
  // Custom durations for different data types
  const cacheDurations = {
    'products': 60, // 1 hour
    'featured_products': 30, // 30 minutes
    'collections': 120, // 2 hours
    'platforms': 240, // 4 hours
    'banners': 180, // 3 hours
    'instagram': 120, // 2 hours
    // Add more as needed
  };
  
  return cacheDurations[key] || DEFAULT_CACHE_DURATION;
};

/**
 * Check if data needs to be refreshed based on time elapsed
 * @param {string} key - Cache key
 * @param {boolean} forceRefresh - Whether to force a refresh
 * @returns {boolean} - Whether data should be refreshed
 */
export const shouldRefreshData = (key, forceRefresh = false) => {
  if (forceRefresh) return true;
  
  try {
    const cacheKey = `sinosply_cache_${key}`;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (!cachedItem) return true;
    
    const { timestamp, version } = JSON.parse(cachedItem);
    
    // Version mismatch forces refresh
    if (version !== CACHE_VERSION) return true;
    
    // Check if cache has expired
    const now = new Date().getTime();
    const cacheTime = parseInt(timestamp);
    const cacheDuration = getCacheDuration(key);
    
    return (now - cacheTime > cacheDuration * 60 * 1000);
  } catch (error) {
    console.error(`[CacheManager] Error checking refresh for ${key}:`, error);
    return true; // On error, refresh to be safe
  }
};