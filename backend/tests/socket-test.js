/**
 * Socket.io Test Script for Sinosply Order Notifications
 * 
 * This script tests the socket connection between client and server
 * for real-time order notifications in the admin panel.
 */

import { io } from 'socket.io-client';
import axios from 'axios';

// Configuration
const SERVER_URL = 'http://localhost:5000'; // Change if your server runs on a different port
const TEST_USER_ID = 'test-admin-user';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function for logging with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  console.log(`${colors.bright}${colors.cyan}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Connect to socket server
log('Initializing socket test script...', colors.magenta);
log(`Attempting to connect to ${SERVER_URL}...`, colors.yellow);

const socket = io(SERVER_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  query: {
    userId: TEST_USER_ID,
    userType: 'admin',
    sessionId: `test-admin-${Date.now()}`
  },
  transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
});

// Track connection state
let isConnected = false;
let reconnectAttempts = 0;

// Socket event handlers
socket.on('connect', () => {
  isConnected = true;
  log(`🔌 Connected to server! Socket ID: ${socket.id}`, colors.green);
  log('Registering as admin user...', colors.yellow);
  
  // Register as admin
  socket.emit('register-admin', TEST_USER_ID);
  
  // Start listening for events immediately
  setupEventListeners();
});

socket.on('admin-registered', (data) => {
  log(`👑 Admin registration ${data.success ? 'successful' : 'failed'}`, data.success ? colors.green : colors.red);
});

socket.on('connect_error', (error) => {
  log(`❌ Connection error: ${error.message}`, colors.red);
  reconnectAttempts++;
  log(`Reconnect attempt ${reconnectAttempts}/5...`, colors.yellow);
});

socket.on('disconnect', () => {
  isConnected = false;
  log('🔌 Disconnected from server', colors.red);
});

socket.on('connect_timeout', () => {
  log('⌛ Connection timeout', colors.red);
});

socket.on('error', (error) => {
  log(`❌ Socket error: ${error.message}`, colors.red);
});

// Setup event listeners for order notifications
function setupEventListeners() {
  log('Setting up event listeners for order notifications...', colors.magenta);
  
  // Listen for new orders
  socket.on('new-order', ({ order }) => {
    log('📦 NEW ORDER RECEIVED:', colors.green);
    log(`  Order #: ${order.orderNumber || order._id}`, colors.green);
    log(`  Customer: ${order.customerName || 'Unknown'}`, colors.green);
    log(`  Amount: ${order.totalAmount || 0}`, colors.green);
    log(`  Status: ${order.status || 'Unknown'}`, colors.green);
    log('  Full Order Data:', colors.yellow);
    console.log(JSON.stringify(order, null, 2));
  });
  
  // Listen for order updates
  socket.on('order-updated', ({ order }) => {
    log('📝 ORDER UPDATE RECEIVED:', colors.blue);
    log(`  Order #: ${order.orderNumber || order._id}`, colors.blue);
    log(`  Status: ${order.status || 'Unknown'}`, colors.blue);
    log('  Full Updated Order Data:', colors.yellow);
    console.log(JSON.stringify(order, null, 2));
  });
  
  // Listen for admin online status
  socket.on('admin-online', ({ adminId }) => {
    log(`👑 Admin online: ${adminId}`, colors.magenta);
  });
  
  // Listen for admin offline status
  socket.on('admin-offline', ({ adminId }) => {
    log(`👥 Admin offline: ${adminId}`, colors.magenta);
  });
}

// Function to test emitting an order update from client to server
function testEmitOrderUpdate() {
  if (!isConnected) {
    log('❌ Not connected to server - cannot emit test order', colors.red);
    return;
  }
  
  const testOrder = {
    _id: `test-order-${Date.now()}`,
    orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    totalAmount: 199.99,
    status: 'Processing',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Test Product', price: 199.99, quantity: 1 }
    ]
  };
  
  log('📤 Emitting test order update event...', colors.yellow);
  socket.emit('order-updated', { order: testOrder });
  log(`Test order emitted: ${testOrder.orderNumber}`, colors.green);
}

// Function to send a test order via the API
async function testApiOrderCreation() {
  try {
    log('🚀 Testing order creation via API...', colors.yellow);
    
    // Try to get a token first (not implemented, just mock)
    log('⚠️ This is a mock API call - would need real token in production', colors.yellow);
    
    // Create simplified test order data
    const testOrderData = {
      customerName: 'API Test Customer',
      customerEmail: 'apitest@example.com',
      totalAmount: 299.99,
      status: 'Pending',
      items: [
        { name: 'API Test Product', price: 299.99, quantity: 1 }
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zip: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'Test Payment'
    };
    
    // Log that this would be a real API call in production
    log('In production, we would send:', colors.yellow);
    console.log(JSON.stringify(testOrderData, null, 2));
    log('API endpoint would be: POST ' + SERVER_URL + '/api/v1/orders', colors.yellow);
    
    // NOTE: We're not actually making the API call to create an order
    // as it would require authentication and actual DB writes
    log('⚠️ API call skipped for this test script', colors.yellow);
    log('👉 Check server logs to see if socket events are emitted when real orders are created', colors.magenta);
  } catch (error) {
    log(`❌ API test error: ${error.message}`, colors.red);
  }
}

// Main test sequence
async function runTests() {
  // Wait for connection
  await new Promise(resolve => {
    const checkConnection = () => {
      if (isConnected) {
        resolve();
      } else if (reconnectAttempts >= 5) {
        log('❌ Failed to connect after 5 attempts, proceeding with tests anyway', colors.red);
        resolve();
      } else {
        setTimeout(checkConnection, 1000);
      }
    };
    
    checkConnection();
  });
  
  // Show test menu
  log('\n==== SOCKET TEST MENU ====', colors.bright + colors.magenta);
  log('Press 1: Test emitting an order update', colors.yellow);
  log('Press 2: Test API order creation (mock)', colors.yellow);
  log('Press q: Quit the test script', colors.yellow);
  log('=========================', colors.bright + colors.magenta);
  
  // Handle user input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async (buffer) => {
    const key = buffer.toString();
    
    if (key === '1') {
      testEmitOrderUpdate();
    } else if (key === '2') {
      await testApiOrderCreation();
    } else if (key === 'q' || key === '\u0003') { // q or Ctrl+C
      log('Exiting test script...', colors.magenta);
      socket.disconnect();
      process.exit(0);
    }
  });
  
  // Just keep listening for events
  log('🎧 Listening for real-time order events...', colors.magenta);
  log('(Events will be displayed here when they occur)', colors.magenta);
}

// Start the tests
runTests();