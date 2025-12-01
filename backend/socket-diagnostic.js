/**
 * Socket.io Diagnostic Tool for Sinosply Order Notifications
 * 
 * This script tests the socket connection between client and server
 * for real-time order notifications
 */

import { io } from 'socket.io-client';

// Configuration - adjust if needed
const SERVER_URL = 'http://localhost:5000'; 
const TEST_USER_ID = 'test-admin-user';

console.log('🔄 Initializing Socket.io diagnostic tool');
console.log(`🔌 Attempting to connect to ${SERVER_URL}...`);

// Connect to socket server
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
  console.log(`🔌 Connected to server! Socket ID: ${socket.id}`);
  console.log('🔌 Registering as admin user...');
  
  // Register as admin
  socket.emit('register-admin', TEST_USER_ID);
});

socket.on('admin-registered', (data) => {
  console.log(`👑 Admin registration ${data.success ? 'successful' : 'failed'}`);
});

socket.on('connect_error', (error) => {
  console.log(`❌ Connection error: ${error.message}`);
  reconnectAttempts++;
  console.log(`⚠️ Reconnect attempt ${reconnectAttempts}/5...`);
});

socket.on('disconnect', () => {
  isConnected = false;
  console.log('🔌 Disconnected from server');
});

socket.on('connect_timeout', () => {
  console.log('⏱️ Connection timeout');
});

socket.on('error', (error) => {
  console.log(`❌ Socket error: ${error}`);
});

// Listen for new orders
socket.on('new-order', ({ order }) => {
  console.log('📦 NEW ORDER RECEIVED:');
  console.log(`  Order #: ${order.orderNumber || order._id}`);
  console.log(`  Customer: ${order.customerName || 'Unknown'}`);
  console.log(`  Amount: ${order.totalAmount || 0}`);
  console.log(`  Status: ${order.status || 'Unknown'}`);
  console.log('  Full Order Data:');
  console.log(JSON.stringify(order, null, 2));
});

// Listen for order updates
socket.on('order-updated', ({ order }) => {
  console.log('📝 ORDER UPDATE RECEIVED:');
  console.log(`  Order #: ${order.orderNumber || order._id}`);
  console.log(`  Status: ${order.status || 'Unknown'}`);
  console.log('  Full Updated Order Data:');
  console.log(JSON.stringify(order, null, 2));
});

// Listen for admin online status
socket.on('admin-online', ({ adminId }) => {
  console.log(`👑 Admin online: ${adminId}`);
});

// Listen for admin offline status
socket.on('admin-offline', ({ adminId }) => {
  console.log(`👥 Admin offline: ${adminId}`);
});

// After a delay, send a test order
setTimeout(() => {
  if (isConnected) {
    console.log('📤 Sending test order event...');
    
    const testOrder = {
      _id: `test-order-${Date.now()}`,
      orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      totalAmount: 199.99,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      items: [
        { name: 'Test Product', price: 199.99, quantity: 1 }
      ]
    };
    
    socket.emit('new-order', { order: testOrder });
    console.log(`📤 Test order emitted: ${testOrder.orderNumber}`);
    
    // After another delay, send an order update
    setTimeout(() => {
      console.log('📤 Sending test order update event...');
      const updatedOrder = {
        ...testOrder,
        status: 'Processing',
        updatedAt: new Date().toISOString()
      };
      
      socket.emit('order-updated', { order: updatedOrder });
      console.log(`📤 Test order update emitted: ${updatedOrder.orderNumber} → ${updatedOrder.status}`);
    }, 5000);
  } else {
    console.log('❌ Not connected to server - cannot emit test order');
  }
}, 3000);

// Keep the script running for a short time
console.log('🎧 Listening for real-time order events...');
console.log('📋 This script will exit automatically after 20 seconds');

// Exit after 20 seconds
setTimeout(() => {
  console.log('👋 Test complete - disconnecting socket');
  socket.disconnect();
  process.exit(0);
}, 20000);