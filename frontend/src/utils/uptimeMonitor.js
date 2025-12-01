/**
 * Uptime Monitor Utility
 * 
 * This utility helps keep the backend server alive by sending periodic pings
 * from the client side. This works alongside the server-side pinging mechanism.
 */

import axios from 'axios';
import apiConfig from '../config/apiConfig';

// Interval in milliseconds (5 minutes = 300,000 ms)
const PING_INTERVAL = 5 * 60 * 1000;

let pingIntervalId = null;

/**
 * Get the base server URL without the /api/v1 path
 * This helps avoid React Router intercepting the API calls
 */
const getServerBaseUrl = () => {
  // Extract the base server URL without the /api/v1 path
  const baseUrlParts = apiConfig.baseURL.split('/api/v1');
  return baseUrlParts[0];
};

/**
 * Send a ping to the backend server
 * @returns {Promise} The axios request promise
 */
export const pingServer = async () => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Pinging server...`);
    
    // Use the server base URL directly to bypass React Router
    const serverUrl = getServerBaseUrl();
    const response = await axios.get(`${serverUrl}/api/v1/uptime/ping`);
    
    if (response.status === 200) {
      console.log(`[${timestamp}] Server ping successful`);
      return response.data;
    } else {
      console.error(`[${timestamp}] Server ping failed: HTTP ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Server ping error: ${error.message}`);
    return null;
  }
};

/**
 * Start the uptime monitoring service
 * @returns {number} The interval ID
 */
export const startUptimeMonitor = () => {
  // Clear any existing interval
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
  }
  
  // Send an initial ping
  pingServer();
  
  // Set up regular pinging
  pingIntervalId = setInterval(() => {
    pingServer();
  }, PING_INTERVAL);
  
  console.log(`Uptime monitor started. Pinging server every ${PING_INTERVAL / 60000} minutes.`);
  
  return pingIntervalId;
};

/**
 * Stop the uptime monitoring service
 */
export const stopUptimeMonitor = () => {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
    console.log('Uptime monitor stopped.');
  }
};

export default {
  pingServer,
  startUptimeMonitor,
  stopUptimeMonitor
}; 