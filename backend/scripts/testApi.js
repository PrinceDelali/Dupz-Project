/**
 * API Testing Script
 * Run this with: node testApi.js
 */

import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://sinosply-backend.onrender.com/api/v1';
const TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with an actual token for testing

// Test endpoints
const endpoints = [
  { name: 'My Orders', url: '/orders/my-orders', method: 'GET', auth: true },
  { name: 'Wishlist', url: '/wishlist', method: 'GET', auth: true }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * Test an API endpoint
 */
async function testEndpoint(endpoint) {
  console.log(`${colors.blue}Testing endpoint: ${endpoint.name} (${endpoint.method} ${endpoint.url})${colors.reset}`);
  
  const options = {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Add authorization header if needed
  if (endpoint.auth && TOKEN !== 'YOUR_AUTH_TOKEN_HERE') {
    options.headers['Authorization'] = `Bearer ${TOKEN}`;
  } else if (endpoint.auth) {
    console.log(`${colors.yellow}Warning: No valid token provided for authenticated endpoint${colors.reset}`);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint.url}`, options);
    const status = response.status;
    const data = await response.json();
    
    if (status >= 200 && status < 300) {
      console.log(`${colors.green}✓ Status: ${status} - Success${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Status: ${status} - Failed${colors.reset}`);
    }
    
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('-'.repeat(50));
    
    return { success: status >= 200 && status < 300, status, data };
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    console.log('-'.repeat(50));
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.blue}=== API Endpoint Testing ====${colors.reset}`);
  console.log(`${colors.blue}Base URL: ${API_URL}${colors.reset}`);
  console.log('-'.repeat(50));
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log(`${colors.blue}==== Testing Complete ====${colors.reset}`);
}

// Run the tests
runTests().catch(err => {
  console.error('Test runner error:', err);
}); 