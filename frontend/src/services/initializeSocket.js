/**
 * Socket Service Initializer
 * 
 * This file provides a utility to initialize socket connection
 * on application startup. It's imported by App.jsx.
 */

import SocketService from './SocketService';

let initialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

/**
 * Initialize the global socket connection
 */
const initializeGlobalSocket = () => {
  console.log('[initializeSocket] Starting global socket initialization');
  
  if (initialized) {
    console.log('[initializeSocket] Socket already initialized, skipping');
    return;
  }
  
  if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
    console.error('[initializeSocket] Maximum initialization attempts reached');
    return;
  }
  
  initializationAttempts++;
  console.log(`[initializeSocket] Initialization attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS}`);

  const userId = localStorage.getItem('userId');
  
  if (!userId) {
    console.warn('[initializeSocket] No userId found in localStorage');
    
    // Attempt to get userId from other potential sources
    const jwtToken = localStorage.getItem('token');
    if (jwtToken) {
      try {
        // Try to extract user ID from JWT token if available
        const tokenData = JSON.parse(atob(jwtToken.split('.')[1]));
        if (tokenData && tokenData.id) {
          console.log('[initializeSocket] Extracted userId from JWT token');
          localStorage.setItem('userId', tokenData.id);
          // Try initialization again with the extracted userId
          setTimeout(() => initializeGlobalSocket(), 500);
          return;
        }
      } catch (err) {
        console.error('[initializeSocket] Error extracting user data from token:', err);
      }
    }
    
    console.error('[initializeSocket] Unable to initialize socket - no user ID available');
    return;
  }

  // Initialize socket connection
  try {
    console.log('[initializeSocket] Initializing socket with userId:', userId);
    const socket = SocketService.initializeSocket(userId);
    
    if (socket) {
      console.log('[initializeSocket] Socket instance created:', socket.id || 'pending connection');
      
      // Set up event handlers for reconnection
      socket.on('connect', () => {
        console.log('[initializeSocket] Socket connected successfully, ID:', socket.id);
        initialized = true;
        
        // Register as admin to receive notifications
        socket.emit('register-admin', userId);
        console.log('[initializeSocket] Sent register-admin event with userId:', userId);
      });
      
      socket.on('connect_error', (error) => {
        console.error('[initializeSocket] Socket connection error:', error);
        
        // If we're still under the max attempts, try again after a delay
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
          console.log(`[initializeSocket] Will retry in ${1000 * initializationAttempts}ms`);
          setTimeout(() => initializeGlobalSocket(), 1000 * initializationAttempts);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('[initializeSocket] Socket disconnected');
        
        // On disconnect, consider the socket uninitialized so we can reinitialize later
        if (initialized) {
          initialized = false;
          initializationAttempts = 0;
          
          // Try to reconnect after a delay if disconnection occurs after initialization
          console.log('[initializeSocket] Will attempt to reconnect in 2000ms');
          setTimeout(() => initializeGlobalSocket(), 2000);
        }
      });
      
      // Add to window for debugging in development
      if (process.env.NODE_ENV !== 'production') {
        window.socketService = SocketService;
        console.log('[initializeSocket] Socket service attached to window for debugging');
      }
    } else {
      console.error('[initializeSocket] Failed to initialize socket - null instance returned');
      
      // Try again after a delay
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        console.log(`[initializeSocket] Will retry in ${1000 * initializationAttempts}ms`);
        setTimeout(() => initializeGlobalSocket(), 1000 * initializationAttempts);
      }
    }
  } catch (error) {
    console.error('[initializeSocket] Error initializing socket:', error);
    
    // Try again after a delay if there was an exception
    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.log(`[initializeSocket] Will retry in ${1000 * initializationAttempts}ms due to error`);
      setTimeout(() => initializeGlobalSocket(), 1000 * initializationAttempts);
    }
  }
};

export default initializeGlobalSocket; 