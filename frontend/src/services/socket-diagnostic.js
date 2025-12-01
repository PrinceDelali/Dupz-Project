/**
 * Socket.io Diagnostic Tool for Frontend
 * 
 * This script tests the frontend socket connection 
 * for real-time order notifications
 */

import apiConfig from '../config/apiConfig';
import { io } from 'socket.io-client';

class SocketDiagnostic {
  constructor() {
    // Configuration - extract from apiConfig
    this.serverUrl = apiConfig.baseURL.replace('/api/v1', '');
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.userId = localStorage.getItem('userId') || 'browser-test-user';
    this.testSessionId = `test-session-${Date.now()}`;
  }

  /**
   * Start the diagnostic process
   */
  start() {
    console.log('🔄 Frontend Socket.io diagnostic tool');
    console.log(`🔌 Attempting to connect to ${this.serverUrl}...`);

    try {
      // Connect to socket server
      this.socket = io(this.serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        query: {
          userId: this.userId,
          userType: 'browser-diagnostic',
          sessionId: this.testSessionId
        },
        transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
      });

      // Setup event listeners
      this.setupEventListeners();
    } catch (err) {
      console.error('❌ Error initializing diagnostic:', err);
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`🔌 Connected to server! Socket ID: ${this.socket.id}`);
      
      // Register as admin for testing
      this.socket.emit('register-admin', this.userId);
      console.log(`🔌 Sent admin registration for: ${this.userId}`);
      
      // After 2 seconds, send test notification
      setTimeout(() => this.sendTestNotification(), 2000);
    });

    this.socket.on('admin-registered', (data) => {
      console.log(`👑 Admin registration ${data.success ? 'successful' : 'failed'}`);
    });

    this.socket.on('connect_error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      this.reconnectAttempts++;
      console.log(`⚠️ Reconnect attempt ${this.reconnectAttempts}/5...`);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('🔌 Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.log(`❌ Socket error: ${error}`);
    });

    // Listen for new orders
    this.socket.on('new-order', ({ order }) => {
      console.log('📦 NEW ORDER RECEIVED:');
      console.log(`  Order #: ${order.orderNumber || order._id}`);
      console.log(`  Customer: ${order.customerName || 'Unknown'}`);
      console.log(`  Amount: ${order.totalAmount || 0}`);
      console.log(`  Status: ${order.status || 'Unknown'}`);
    });

    // Listen for order updates
    this.socket.on('order-updated', ({ order }) => {
      console.log('📝 ORDER UPDATE RECEIVED:');
      console.log(`  Order #: ${order.orderNumber || order._id}`);
      console.log(`  Status: ${order.status || 'Unknown'}`);
    });

    // Listen for notifications
    this.socket.on('status-notification', (data) => {
      console.log('🔔 NOTIFICATION RECEIVED:');
      console.log(`  Title: ${data.title}`);
      console.log(`  Message: ${data.message}`);
      console.log(`  Type: ${data.type}`);
      console.log(`  Data: `, data.orderData);
    });
  }

  /**
   * Send a test notification
   */
  sendTestNotification() {
    if (!this.isConnected) {
      console.log('❌ Not connected - cannot send test notification');
      return;
    }

    console.log('📤 Sending test order status change...');
    
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
    
    // First emit a new order
    this.socket.emit('new-order', { order: testOrder });
    console.log(`📤 Test order emitted: ${testOrder.orderNumber}`);
    
    // After a delay, emit a status change
    setTimeout(() => {
      const previousStatus = testOrder.status;
      testOrder.status = 'Processing';
      
      this.socket.emit('status-change', {
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        previousStatus: previousStatus,
        newStatus: testOrder.status,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📤 Test status change emitted: ${testOrder.orderNumber} (${previousStatus} -> ${testOrder.status})`);
    }, 3000);
  }

  /**
   * Stop the diagnostic process
   */
  stop() {
    if (this.socket) {
      console.log('👋 Stopping diagnostic - disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketDiagnostic; 