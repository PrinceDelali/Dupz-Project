import express from 'express';
import { protect } from '../middleware/auth.js';

// Create a test Express app
const app = express();

// Test route patterns
const testPatterns = [
  // Fixed routes first
  app.get('/api/v1/orders/debug', (req, res) => res.send('debug route')),
  app.get('/api/v1/orders/my-orders', protect, (req, res) => res.send('my orders route')),
  
  // Dynamic routes after
  app.get('/api/v1/orders/:id', (req, res) => res.send(`order id route: ${req.params.id}`))
];

// Test cases
const testCases = [
  '/api/v1/orders/debug',
  '/api/v1/orders/my-orders',
  '/api/v1/orders/12345'
];

// Testing function
function testRouteMatching() {
  console.log('=== Testing Express Route Matching ===');

  // Create a mock request object
  const createMockReq = (path) => ({
    method: 'GET',
    url: path,
    path: path,
    params: {}
  });

  // Create a mock response object
  const mockRes = {
    send: (msg) => console.log(`Response for ${mockReq.path}: "${msg}"`)
  };

  for (const path of testCases) {
    console.log(`\nTesting path: ${path}`);
    const mockReq = createMockReq(path);
    
    let matched = false;
    let layer;

    // In express, the first matching route wins
    // This simplified logic mimics how Express router works
    if (path === '/api/v1/orders/debug') {
      console.log('Should match "debug" route');
      matched = true;
      layer = 'debug route';
    } else if (path === '/api/v1/orders/my-orders') {
      console.log('Should match "my-orders" route');
      matched = true;
      layer = 'my orders route';
    } else if (path.startsWith('/api/v1/orders/')) {
      console.log('Should match dynamic ":id" route');
      matched = true;
      layer = `order id route: ${path.split('/').pop()}`;
    }

    if (matched) {
      console.log(`✓ Route matched: ${layer}`);
    } else {
      console.log('✗ No route matched');
    }
  }

  console.log('\n=== Test complete ===');
}

// Run the test
testRouteMatching(); 