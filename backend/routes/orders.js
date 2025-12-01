import express from 'express';
import { 
  createOrder, 
  getOrderById, 
  getOrderByTracking, 
  getMyOrders, 
  updateOrderStatus,
  orderDiagnostic,
  createTestOrder,
  authCheck,
  getFallbackOrders,
  getOrders
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';

const router = express.Router();

// Define the getDirectOrders function before it's used in routes
// Add a new direct fetch function for debugging
const getDirectOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    console.log(`Direct orders fetch for user: ${userId}`);
    
    // Use a simple, direct query with minimal fields and processing
    const orders = await Order.find({ user: userId })
      .select('orderNumber status totalAmount createdAt items.name items.price items.quantity')
      .sort({ createdAt: -1 })
      // Removed limit to fetch all orders
      .lean();
    
    console.log(`Found ${orders.length} orders for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      count: orders.length,
      message: 'Direct orders fetch successful',
      data: orders
    });
  } catch (error) {
    console.error('Direct orders fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders directly',
      message: error.message
    });
  }
});

// Optional protect middleware - populates req.user if token is valid but doesn't block request
const optionalProtect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Order route - Token present:', !!token);
      
      // If token exists, verify and add user to req
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      
      if (req.user) {
        console.log('Order route - Authenticated user:', req.user.email, '(ID:', req.user.id, ')');
      } else {
        console.log('Order route - Token valid but user not found');
      }
    } else {
      console.log('Order route - No auth token, proceeding as guest checkout');
    }
    
    // DEBUG: Log receipt data if present in the request
    if (req.body && req.body.paymentReceipt) {
      console.log('🧾 [RECEIPT DEBUG] optionalProtect middleware - Payment receipt found:', {
        type: req.body.paymentReceipt.type || 'none',
        hasImageData: !!req.body.paymentReceipt.imageData,
        imageDataLength: req.body.paymentReceipt.imageData?.length || 0,
        hasLink: !!req.body.paymentReceipt.link,
        hasNote: !!req.body.paymentReceipt.note
      });
    }
  } catch (err) {
    console.error('Order route - Auth error:', err.message);
    // Continue as guest if token is invalid
  }
  
  // Always proceed to the next middleware
  next();
};

// Add a receipt debugging middleware specifically for order creation
const traceReceiptData = (req, res, next) => {
  console.log('🔍 [RECEIPT TRACE] Order creation request received');
  
  if (req.body && req.body.paymentReceipt) {
    console.log('📋 [RECEIPT TRACE] Incoming payment receipt:', {
      type: req.body.paymentReceipt.type || 'none',
      hasImageData: !!req.body.paymentReceipt.imageData,
      imageDataSize: req.body.paymentReceipt.imageData ? 
        `${(req.body.paymentReceipt.imageData.length / 1024 / 1024).toFixed(2)}MB` : '0MB',
      hasLink: !!req.body.paymentReceipt.link,
      uploadedAt: req.body.paymentReceipt.uploadedAt || 'not set'
    });
    
    // Ensure receipt type is set properly
    if (!req.body.paymentReceipt.type) {
      console.log('⚠️ [RECEIPT TRACE] Receipt type is not set, determining type from content');
      if (req.body.paymentReceipt.imageData) {
        req.body.paymentReceipt.type = 'image';
        console.log('✅ [RECEIPT TRACE] Setting receipt type to "image" based on content');
      } else if (req.body.paymentReceipt.link) {
        req.body.paymentReceipt.type = 'link';
        console.log('✅ [RECEIPT TRACE] Setting receipt type to "link" based on content');
      } else {
        req.body.paymentReceipt.type = 'none';
        console.log('✅ [RECEIPT TRACE] Setting receipt type to "none" (no content)');
      }
    }
  } else {
    console.log('⚠️ [RECEIPT TRACE] No payment receipt in request');
  }
  
  // Store original response.json method
  const originalJson = res.json;
  
  // Override response.json to inspect the data being sent back
  res.json = function(data) {
    if (data && data.data && data.data.paymentReceipt) {
      console.log('📤 [RECEIPT TRACE] Outgoing payment receipt in response:', {
        type: data.data.paymentReceipt.type || 'none',
        hasImageData: !!data.data.paymentReceipt.imageData, 
        hasLink: !!data.data.paymentReceipt.link
      });
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};

// Debug route - always accessible
router.get('/debug', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Orders routes are correctly configured',
    routes: [
      { method: 'POST', path: '/', description: 'Create order' },
      { method: 'GET', path: '/track/:trackingNumber', description: 'Get order by tracking number' },
      { method: 'GET', path: '/my-orders', description: 'Get user orders (protected)' },
      { method: 'GET', path: '/diagnostic', description: 'Order diagnostic tool (protected)' },
      { method: 'GET', path: '/auth-check', description: 'Auth token diagnostic tool (public)' },
      { method: 'POST', path: '/create-test', description: 'Create test order (protected)' },
      { method: 'GET', path: '/:id', description: 'Get order by ID' },
      { method: 'PUT', path: '/:id/status', description: 'Update order status (admin only)' },
      { method: 'GET', path: '/direct-orders', description: 'Get direct orders (protected)' },
      { method: 'GET', path: '/fallback', description: 'Get fallback orders from file (protected)' },
      { method: 'GET', path: '/', description: 'Get all orders (admin only)' },
      { method: 'POST', path: '/receipt-debug', description: 'Debug receipt payload (public)' }
    ]
  });
});

// Add a debug route to test receipt processing
router.post('/receipt-debug', (req, res) => {
  // Log receipt data for debugging
  console.log('🔍 Receipt Debug Route - Request received');
  
  try {
    const { paymentReceipt } = req.body;
    
    // Log the receipt data
    console.log('📝 Receipt Debug - Payment receipt:', {
      received: !!paymentReceipt,
      type: paymentReceipt?.type || 'none',
      hasImageData: !!paymentReceipt?.imageData,
      imageDataSize: paymentReceipt?.imageData ? 
        `${(paymentReceipt.imageData.length * 0.75 / 1024 / 1024).toFixed(2)}MB` : 
        'N/A',
      hasLink: !!paymentReceipt?.link,
      uploadedAt: paymentReceipt?.uploadedAt || 'N/A'
    });
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Receipt data received and logged',
      details: {
        received: !!paymentReceipt,
        type: paymentReceipt?.type || 'none',
        hasImageData: !!paymentReceipt?.imageData,
        imageDataSize: paymentReceipt?.imageData ? 
          `${(paymentReceipt.imageData.length * 0.75 / 1024 / 1024).toFixed(2)}MB` : 
          'N/A'
      }
    });
  } catch (error) {
    console.error('❌ Error in receipt debug route:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing receipt data',
      error: error.message
    });
  }
});

console.log('Initializing order routes...');

// Route handler for receiving order notifications via HTTP
const handleOrderNotification = (req, res) => {
  try {
    const { order } = req.body;
    
    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'No order data provided'
      });
    }
    
    console.log('📩 [Orders API] Received order notification request for order:', order.orderNumber || order._id);
    
    // Emit the notification using socket.io
    try {
      const { notifyNewOrder } = getNotifiers();
      notifyNewOrder(order);
      console.log('✅ [Orders API] Successfully emitted socket notification for new order');
    } catch (socketError) {
      console.error('❌ [Orders API] Error emitting socket notification:', socketError);
      // Continue processing even if socket emit fails
    }
    
    return res.status(200).json({
      success: true,
      message: 'Order notification processed successfully'
    });
  } catch (error) {
    console.error('❌ [Orders API] Error handling notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process order notification',
      error: error.message
    });
  }
};

// IMPORTANT: Route Order Matters!
// Define specific routes before dynamic parameter routes to avoid conflicts
// Route /my-orders must come before /:id to avoid being treated as an ID parameter

// Get all orders for admin
router.get('/', protect, authorize('admin'), getOrders);

// Protected routes - specific paths
router.get('/my-orders', protect, getMyOrders);
router.get('/diagnostic', protect, orderDiagnostic);
router.get('/auth-check', authCheck); // Auth diagnostic - public
router.get('/fallback', protect, getFallbackOrders); // Fallback route
router.get('/direct-orders', protect, getDirectOrders); // Direct route with minimal processing
router.post('/create-test', protect, createTestOrder);
router.get('/track/:trackingNumber', getOrderByTracking);

// Real-time order notification endpoint
router.post('/notify-new-order', handleOrderNotification); // Public for client-side notifications

// Public routes with optional protection to identify users when possible
// Apply the trace middleware before creating the order
router.post('/', optionalProtect, traceReceiptData, createOrder);

// Routes with dynamic parameters (must come AFTER specific routes)
router.get('/:id', getOrderById);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

// Import notification functions from socket.js
import { getNotifiers } from '../socket.js';

console.log('Order routes initialized successfully!');

export default router; 