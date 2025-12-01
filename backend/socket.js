import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

// Socket.io instance and event emitters
let io = null;
let notifyNewOrderFn = null;
let notifyOrderUpdateFn = null;
let notifyStatusChangeFn = null;

// Socket.io setup function
const setupSocket = (app, server) => {
  if (io) {
    console.log('Socket.io already initialized, reusing existing instance');
    return { 
      io, 
      notifyNewOrder: notifyNewOrderFn,
      notifyOrderUpdate: notifyOrderUpdateFn,
      notifyStatusChange: notifyStatusChangeFn
    };
  }

  console.log('Setting up Socket.io server');
  
  // Create IO server with CORS setup
  io = new Server(server, {
    cors: {
      origin: "*", // In production, restrict this to your frontend URL
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Store active connections for admin users
  const adminConnections = new Map();

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    
    // Handle new order events from clients
    socket.on('new-order', ({ order }) => {
      console.log(`📦 Received new order event from client: ${order.orderNumber || order._id}`);
      // Re-broadcast to all clients including admins
      io.emit('new-order', { order });
    });
    
    // Handle order update events from clients
    socket.on('order-updated', ({ order }) => {
      console.log(`📝 Received order update event from client: ${order.orderNumber || order._id}`);
      // Re-broadcast to all clients
      io.emit('order-updated', { order });
    });

    // Handle status change events - new handler
    socket.on('status-change', (statusData) => {
      console.log(`🔔 Received status change for order: ${statusData.orderNumber || statusData.orderId}`);
      console.log(`   Status: ${statusData.previousStatus} -> ${statusData.newStatus}`);
      
      // Create a notification payload
      const notification = {
        title: `Order Status Updated: ${statusData.newStatus}`,
        message: `Order #${statusData.orderNumber} has been updated from ${statusData.previousStatus} to ${statusData.newStatus}`,
        type: 'order_status',
        orderData: {
          orderId: statusData.orderId,
          orderNumber: statusData.orderNumber,
          status: statusData.newStatus
        },
        timestamp: statusData.timestamp || new Date().toISOString()
      };
      
      // Broadcast notification to all connected clients
      io.emit('status-notification', notification);
      console.log(`🔔 Broadcasted status notification to all clients`);
    });
    
    // Handle admin registration
    socket.on('register-admin', (adminId) => {
      console.log(`👑 Admin registered: ${adminId} (${socket.id})`);
      adminConnections.set(socket.id, { adminId, socket });
      
      // Send confirmation
      socket.emit('admin-registered', { success: true });
      
      // Broadcast admin online status to other admins
      socket.broadcast.emit('admin-online', { adminId });
    });
    
    // Handle client disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      if (adminConnections.has(socket.id)) {
        const { adminId } = adminConnections.get(socket.id);
        console.log(`👑 Admin disconnected: ${adminId}`);
        io.emit('admin-offline', { adminId });
        adminConnections.delete(socket.id);
      }
    });
  });

  // Create notification functions
  notifyNewOrderFn = (order) => {
    if (!order) {
      console.warn('Cannot notify about undefined order');
      return;
    }
    
    console.log(`📦 Broadcasting new order: ${order.orderNumber || order._id}`);
    io.emit('new-order', { order });
  };

  notifyOrderUpdateFn = (order) => {
    if (!order) {
      console.warn('Cannot notify about undefined order update');
      return;
    }
    
    console.log(`📝 Broadcasting order update: ${order.orderNumber || order._id}`);
    io.emit('order-updated', { order });
  };

  // Add new status change notifier
  notifyStatusChangeFn = (orderId, orderNumber, previousStatus, newStatus) => {
    if (!orderId || !orderNumber) {
      console.warn('Cannot notify about status change with missing order data');
      return;
    }
    
    console.log(`🔔 Broadcasting status change: ${orderNumber} (${previousStatus} -> ${newStatus})`);
    
    // Create notification object
    const notification = {
      title: `Order Status Updated: ${newStatus}`,
      message: `Order #${orderNumber} has been updated from ${previousStatus} to ${newStatus}`,
      type: 'order_status',
      orderData: {
        orderId,
        orderNumber,
        status: newStatus
      },
      timestamp: new Date().toISOString()
    };
    
    // Send to all clients
    io.emit('status-notification', notification);
  };

  return {
    io,
    notifyNewOrder: notifyNewOrderFn,
    notifyOrderUpdate: notifyOrderUpdateFn,
    notifyStatusChange: notifyStatusChangeFn
  };
};

// Get the notifiers even if they're not initialized yet
export const getNotifiers = () => ({
  notifyNewOrder: order => {
    if (notifyNewOrderFn) {
      return notifyNewOrderFn(order);
    } else {
      console.warn('Socket notification attempted before socket initialization');
    }
  },
  notifyOrderUpdate: order => {
    if (notifyOrderUpdateFn) {
      return notifyOrderUpdateFn(order);
    } else {
      console.warn('Socket notification attempted before socket initialization');
    }
  },
  notifyStatusChange: (orderId, orderNumber, previousStatus, newStatus) => {
    if (notifyStatusChangeFn) {
      return notifyStatusChangeFn(orderId, orderNumber, previousStatus, newStatus);
    } else {
      console.warn('Status change notification attempted before socket initialization');
    }
  }
});

export default setupSocket; 