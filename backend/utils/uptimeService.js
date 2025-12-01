/**
 * Uptime Service
 * 
 * This service ensures the server stays alive by pinging it at regular intervals
 * and also provides an endpoint that external uptime monitoring services like UptimeRobot can hit.
 */

import pingServer from './keepAlive.js';

// Interval in milliseconds (5 minutes = 300,000 ms)
const PING_INTERVAL = 5 * 60 * 1000;

let pingInterval = null;

/**
 * Start the uptime service
 */
export function startUptimeService() {
  // Clear any existing interval
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  
  // Initial ping when service starts
  pingServer();
  
  // Set up regular pinging
  pingInterval = setInterval(() => {
    pingServer();
  }, PING_INTERVAL);
  
  console.log(`Uptime service started. Pinging server every ${PING_INTERVAL / 60000} minutes.`);
  
  return pingInterval;
}

/**
 * Stop the uptime service
 */
export function stopUptimeService() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log('Uptime service stopped.');
  }
}

/**
 * Get the status of the uptime service
 */
export function getUptimeStatus() {
  return {
    active: pingInterval !== null,
    interval: PING_INTERVAL,
    intervalMinutes: PING_INTERVAL / 60000
  };
}

export default {
  startUptimeService,
  stopUptimeService,
  getUptimeStatus
}; 