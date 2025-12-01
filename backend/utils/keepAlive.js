/**
 * Keep Alive Utility
 * 
 * This script sends a request to the backend server to prevent it from
 * spinning down due to inactivity on free-tier hosting.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL to ping (your backend)
const url = process.env.BACKEND_URL || 'https://sinosply-backend.onrender.com';

// Log file path
const logFilePath = path.join(__dirname, '../logs/keep-alive.log');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Ping the server and log the result
 */
async function pingServer() {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] Pinging server at ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const logMessage = `[${timestamp}] Server ping successful (${responseTime}ms)\n`;
      console.log(logMessage.trim());
      fs.appendFileSync(logFilePath, logMessage);
    } else {
      const logMessage = `[${timestamp}] Server ping failed: HTTP ${response.status} (${responseTime}ms)\n`;
      console.error(logMessage.trim());
      fs.appendFileSync(logFilePath, logMessage);
    }
  } catch (error) {
    const logMessage = `[${timestamp}] Server ping error: ${error.message}\n`;
    console.error(logMessage.trim());
    fs.appendFileSync(logFilePath, logMessage);
  }
}

// If this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  pingServer().catch(err => {
    console.error('Error in keep-alive script:', err);
    process.exit(1);
  });
}

export default pingServer; 