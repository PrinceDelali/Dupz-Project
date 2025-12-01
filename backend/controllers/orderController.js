import mongoose from 'mongoose';
import Order from '../models/Order.js';
import asyncHandler from '../middleware/asyncHandler.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

/**
 * Utility function to normalize user IDs
 * This handles different user ID formats that might be passed
 * @param {string|Object} userId - The user ID from different sources (JWT, req.user, etc)
 * @returns {string|null} - Normalized user ID or null if invalid
 */
const normalizeUserId = (userId) => {
  if (!userId) return null;
  
  // If it's already a string, return it
  if (typeof userId === 'string') return userId;
  
  // If it's a mongoose ObjectId, convert to string
  if (userId instanceof mongoose.Types.ObjectId) return userId.toString();
  
  // If it's an object with _id property (like a User model)
  if (userId._id) return userId._id.toString();
  
  // If it's an object with id property (like from JWT)
  if (userId.id) return userId.id.toString();
  
  // If it's a number, convert to string
  if (typeof userId === 'number') return userId.toString();
  
  // Otherwise, it's not a valid user ID
  return null;
};

// Get file path for fallback orders cache
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackOrdersDir = path.join(__dirname, '../temp');
const fallbackOrdersFile = path.join(fallbackOrdersDir, 'orders_fallback.json');


// Ensure temp directory exists
try {
  if (!fs.existsSync(fallbackOrdersDir)) {
    fs.mkdirSync(fallbackOrdersDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create fallback directory:', err);
}

// Function to update product stock after order
const updateProductStock = async (items) => {
  try {
    console.log('Updating product stock levels for ordered items...');
    
    if (!items || !items.length) {
      console.log('No items to update stock for');
      return { success: false, message: 'No items provided' };
    }
    
    const stockUpdates = [];
    
    // Process each ordered item
    for (const item of items) {
      const productId = item.productId;
      const orderedQuantity = parseInt(item.quantity) || 1;
      
      if (!productId) {
        console.warn(`No product ID found for item: ${item.name}`);
        continue;
      }
      
      try {
        // Find the product and update its stock
        const product = await Product.findById(productId);
        
        if (!product) {
          console.warn(`Product not found with ID: ${productId}`);
          continue;
        }
        
        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - orderedQuantity); // Prevent negative stock
        
        // Update the product stock
        await Product.findByIdAndUpdate(productId, { stock: newStock });
        
        stockUpdates.push({
          productId,
          name: product.name,
          previousStock: currentStock,
          newStock,
          reduction: orderedQuantity
        });
        
        console.log(`Stock updated for product ${product.name} (${productId}): ${currentStock} → ${newStock}`);
      } catch (error) {
        console.error(`Error updating stock for product ${productId}:`, error);
      }
    }
    
    return {
      success: true,
      updatedProducts: stockUpdates.length,
      stockUpdates
    };
  } catch (error) {
    console.error('Error in updateProductStock function:', error);
    return { success: false, error: error.message };
  }
};

// Fallback function to save orders to file
const saveOrdersToFallback = async (userId, orders) => {
  try {
    // Create a map of users to their orders
    let allOrders = {};
    
    // Read existing file if it exists
    if (fs.existsSync(fallbackOrdersFile)) {
      const fileContent = fs.readFileSync(fallbackOrdersFile, 'utf8');
      allOrders = JSON.parse(fileContent);
    }
    
    // Update with new orders
    allOrders[userId] = {
      timestamp: new Date().toISOString(),
      orders
    };
    
    // Write back to file
    fs.writeFileSync(
      fallbackOrdersFile, 
      JSON.stringify(allOrders, null, 2),
      'utf8'
    );
    
    console.log(`Saved ${orders.length} orders to fallback file for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to save orders to fallback file:', error);
    return false;
  }
};

// Fallback function to get orders from file
const getOrdersFromFallback = async (userId) => {
  try {
    if (!fs.existsSync(fallbackOrdersFile)) {
      return { success: false, error: 'No fallback file exists' };
    }
    
    const fileContent = fs.readFileSync(fallbackOrdersFile, 'utf8');
    const allOrders = JSON.parse(fileContent);
    
    if (!allOrders[userId]) {
      return { success: false, error: 'No orders for this user in fallback' };
    }
    
    return { 
      success: true, 
      data: allOrders[userId].orders,
      timestamp: allOrders[userId].timestamp
    };
  } catch (error) {
    console.error('Failed to read orders from fallback file:', error);
    return { success: false, error: error.message };
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (to allow guest checkouts) with optional authentication
export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    paymentDetails,
    subtotal,
    tax,
    shipping,
    discount,
    totalAmount,
    customerEmail,
    customerName,
    shippingMethod,
    shippingType, // Add shipping type (air/sea)
    userId // Accept userId from frontend
  } = req.body;

  // Log shipping information
  console.log(`🚢 ORDER: Creating order with shipping type: ${shippingType || 'standard'}`);
  console.log(`🚢 ORDER: Shipping method: ${shippingMethod}, Cost: ${shipping}`);
  
  // Log shipping details for items
  if (items && items.length > 0) {
    console.log(`📦 ORDER: Order contains ${items.length} items with shipping data:`);
    items.forEach(item => {
      console.log(`  - Product: ${item.name}, ID: ${item.id || item.productId}`);
      console.log(`    Air Shipping: ${item.airShippingPrice || 0} GHS, ${item.airShippingDuration || 0} days`);
      console.log(`    Sea Shipping: ${item.seaShippingPrice || 0} GHS, ${item.seaShippingDuration || 0} days`);
    });
  }

  // User ID resolution with improved logging
  // First try to get the userId from req.user (set by auth middleware)
  // Then try the userId from the request body
  const authenticatedUserId = req.user ? req.user.id : null;
  const resolvedUserId = authenticatedUserId || userId || null;
  
  console.log("Order Creation - User ID Resolution:");
  console.log("  Authenticated user ID:", authenticatedUserId);
  console.log("  User ID from request body:", userId);
  console.log("  Final resolved user ID:", resolvedUserId);
  
  // Validate required fields
  if (!items || !items.length || !shippingAddress || !totalAmount) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide all required order information' 
    });
  }

  // Generate tracking number
  const generateTrackingNumber = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let trackingNumber = '';
    
    // Add 2 letters
    for (let i = 0; i < 2; i++) {
      trackingNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Add 9 numbers
    for (let i = 0; i < 9; i++) {
      trackingNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Add 2 more letters
    for (let i = 0; i < 2; i++) {
      trackingNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    return trackingNumber;
  };

  // Create estimated delivery date (5-7 business days)
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 5 + Math.floor(Math.random() * 3));

  // Create receipt ID
  const receiptId = `RCP-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

  // Generate order number (since the pre-save hook isn't working properly)
  const count = await Order.countDocuments();
  const orderNumber = req.body.orderNumber || `ORD-${String(10000 + count).padStart(5, '0')}`;

  try {
    // Create order data object with the resolved userId
    const orderData = {
      orderNumber,
      user: resolvedUserId, // Use the resolved user ID
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentDetails,
      subtotal,
      tax: tax || 0,
      shipping: shipping || 0,
      discount: discount || 0,
      totalAmount,
      status: 'Processing',
      trackingNumber: generateTrackingNumber(),
      shippingMethod: shippingMethod || 'Standard Shipping',
      estimatedDelivery: deliveryDate,
      receiptId,
      customerEmail,
      customerName
    };
    
    // Include payment receipt information if provided in the request
    if (req.body.paymentReceipt) {
      console.log('💾 [RECEIPT FIX] Adding payment receipt to order:', {
        type: req.body.paymentReceipt.type || 'none',
        hasImageData: !!req.body.paymentReceipt.imageData,
        imageDataLength: req.body.paymentReceipt.imageData?.length || 0
      });
      
      // Ensure the payment receipt has a valid type
      const receiptType = req.body.paymentReceipt.type || 
        (req.body.paymentReceipt.imageData ? 'image' : 
         req.body.paymentReceipt.link ? 'link' : 'none');
      
      orderData.paymentReceipt = {
        type: receiptType,
        imageData: req.body.paymentReceipt.imageData || '',
        link: req.body.paymentReceipt.link || '',
        uploadedAt: req.body.paymentReceipt.uploadedAt || new Date(),
        note: req.body.paymentReceipt.note || ''
      };
    } else {
      console.log('📝 [RECEIPT FIX] No payment receipt in request, using default empty receipt');
      orderData.paymentReceipt = {
        type: 'none',
        imageData: '',
        link: '',
        uploadedAt: new Date()
      };
    }
    
    console.log("Creating order with user:", resolvedUserId);
    console.log("Order user field type:", typeof resolvedUserId);
    console.log("Order payment receipt type:", orderData.paymentReceipt.type);
    
    // Create the order using the orderData object
    const order = await Order.create(orderData);

    console.log(`Order created successfully. ID: ${order._id}, User ID set to: ${order.user || 'guest'}`);

    // Update product stock levels
    const stockUpdateResult = await updateProductStock(items);
    console.log('Stock update result:', stockUpdateResult);

    // Import email service here to avoid circular dependencies
    const { sendOrderEmails } = await import('../utils/emailService.js');
    
    // Check if this is a new customer for email personalization
    let isNewCustomer = false;
    if (resolvedUserId) {
      const userOrderCount = await Order.countDocuments({ user: resolvedUserId });
      isNewCustomer = userOrderCount <= 1; // This order would be their first
    } else {
      // For guest checkouts, check if email has been used before
      const emailOrderCount = await Order.countDocuments({ customerEmail });
      isNewCustomer = emailOrderCount <= 1; // This order would be their first
    }
    
    // Prepare response object
    const responseData = {
      success: true,
      data: order,
      emailStatus: { attempted: false },
      stockUpdateStatus: stockUpdateResult
    };
    
    // Send emails (with a timeout to prevent blocking the response)
    setTimeout(async () => {
      try {
        console.log('Initiating email sending process for order:', order.orderNumber);
        
        // NOTE: In development, if using Resend's default onboarding@resend.dev sender,
        // emails will only be sent to delivered@resend.dev (Resend's test email).
        // In production with a verified domain, this limitation is removed.
        const emailResult = await sendOrderEmails(order, { isNewCustomer });
        
        console.log('Email sending completed with result:', {
          success: emailResult.success,
          customerEmail: emailResult.customerEmail ? 'Attempted' : 'Not attempted',
          adminEmail: emailResult.adminEmail ? 'Attempted' : 'Not attempted'
        });
        
        // If any emails contain a test/ethereal preview URL, log it for testing
        if (emailResult.customerEmail?.previewUrl) {
          console.log('Customer email preview URL:', emailResult.customerEmail.previewUrl);
        }
        if (emailResult.adminEmail?.previewUrl) {
          console.log('Admin email preview URL:', emailResult.adminEmail.previewUrl);
        }
      } catch (emailError) {
        console.error('Uncaught error in email sending process:', emailError);
      }
    }, 100);
    
    // Set a flag to indicate email sending was attempted
    responseData.emailStatus = { 
      attempted: true,
      message: "Order confirmation emails are being processed and will be sent shortly."
    };

    // Return the response immediately without waiting for emails
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private or Public with order token
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;
  
  // Find order by ID or order number
  const query = mongoose.Types.ObjectId.isValid(id) 
    ? { _id: id } 
    : { orderNumber: id };
  
  // Using lean() for faster query when we don't need to modify the document
  const order = await Order.findOne(query).lean();
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }
  
  // If user is not logged in, verify with token
  if (!req.user) {
    // Simple token-based access (in production use proper JWT or equivalent)
    if (!token || token !== order.receiptId) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }
  } else if (order.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    // Logged in users can only access their own orders unless they're admin
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this order'
    });
  }
  
  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Get order by tracking number
// @route   GET /api/orders/track/:trackingNumber
// @access  Public
export const getOrderByTracking = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.params;
  
  // Using projection to limit fields for better performance
  const order = await Order.findOne(
    { trackingNumber },
    'orderNumber trackingNumber status shippingMethod estimatedDelivery createdAt items shippingAddress'
  ).lean();
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'No order found with this tracking number'
    });
  }
  
  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Get user orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] getMyOrders: Starting request...`);
  
  try {
    // Validate user information is available
    if (!req.user) {
      console.log(`[${new Date().toISOString()}] getMyOrders: No user in request`);
      return res.status(401).json({
        success: false,
        error: 'Authentication required - No user found in request'
      });
    }
    
    const userId = req.user.id;
    console.log(`[${new Date().toISOString()}] getMyOrders: User ID: ${userId}, type: ${typeof userId}`);
    
    if (!userId) {
      console.log(`[${new Date().toISOString()}] getMyOrders: Invalid user ID`);
      return res.status(400).json({
        success: false,
        error: 'Invalid user information - Failed to extract valid user ID'
      });
    }

    // Check if client requested pagination
    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 0;

    // Enhanced logging for the query we're about to execute
    console.log(`[${new Date().toISOString()}] getMyOrders: Building query with userId: ${userId}`);
    
    // First, check if user exists in MongoDB (this can catch issues with ObjectId format)
    const userExists = await mongoose.connection.db.collection('users').findOne({ 
      _id: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId 
    });
    
    console.log(`[${new Date().toISOString()}] getMyOrders: User exists in MongoDB: ${!!userExists}`);
    if (userExists) {
      console.log(`[${new Date().toISOString()}] getMyOrders: Found user with MongoDB ID: ${userExists._id}`);
    }

    // Create a query that searches for orders either by direct user ID match
    // or by customer email if available
    const userQuery = {
      $or: [
        { user: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId }
      ]
    };
    
    // If we have user email from req.user, add it to the query
    if (req.user.email) {
      userQuery.$or.push({ customerEmail: req.user.email });
      console.log(`[${new Date().toISOString()}] getMyOrders: Added email to query: ${req.user.email}`);
    }

    console.log(`[${new Date().toISOString()}] getMyOrders: Final query:`, JSON.stringify(userQuery));

    // Build query
    let query = Order.find(userQuery)
      .select('orderNumber status totalAmount createdAt trackingNumber items shippingAddress customerName shippingMethod')
      .sort({ createdAt: -1 })
      .lean();
    
    // Apply pagination only if requested
    if (page > 0 && limit > 0) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
      console.log(`[${new Date().toISOString()}] getMyOrders: Pagination applied - page ${page}, limit ${limit}`);
    } else {
      console.log(`[${new Date().toISOString()}] getMyOrders: No pagination - fetching all orders`);
    }

    console.log(`[${new Date().toISOString()}] getMyOrders: Starting database query for user ${userId}`);
    const queryStartTime = Date.now();

    // Execute query
    const orders = await query.exec();
    
    const queryEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] getMyOrders: Database query completed in ${queryEndTime - queryStartTime}ms`);
    console.log(`[${new Date().toISOString()}] getMyOrders: Found ${orders.length} orders for user ${userId}`);
    
    // Add debugging information about the orders found
    if (orders.length > 0) {
      const orderIds = orders.map(o => o._id).slice(0, 3); // Show first 3 for brevity
      console.log(`[${new Date().toISOString()}] getMyOrders: First few order IDs:`, orderIds);
    }
    
    // Don't use fallback anymore - just return what we found
    
    // Add cache headers for performance
    res.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes for this user
    
    // Send optimized response
    const response = {
      success: true,
      count: orders.length,
      data: orders,
      diagnostics: {
        queryTime: queryEndTime - queryStartTime,
        totalTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
    
    const endTime = Date.now();
    console.log(`[${new Date().toISOString()}] getMyOrders: Request completed in ${endTime - startTime}ms`);
    
    return res.status(200).json(response);
  } catch (error) {
    const endTime = Date.now();
    console.error(`[${new Date().toISOString()}] getMyOrders ERROR: ${error.message}`);
    console.error(`[${new Date().toISOString()}] getMyOrders: Stack trace: ${error.stack}`);
    console.error(`[${new Date().toISOString()}] getMyOrders: Request failed after ${endTime - startTime}ms`);
    
    // No more fallback, just return the error
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
      details: error.message,
      diagnostics: {
        processingTime: endTime - startTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin only
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a status'
    });
  }
  
  const order = await Order.findById(id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }
  
  order.status = status;
  await order.save();
  
  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Diagnostic endpoint to analyze orders and user IDs
// @route   GET /api/v1/orders/diagnostic
// @access  Private
export const orderDiagnostic = asyncHandler(async (req, res) => {
  try {
    // Get basic stats
    const totalOrders = await Order.countDocuments();
    
    // Get count of orders with user field set
    const ordersWithUser = await Order.countDocuments({ user: { $ne: null } });
    
    // Get count of orders for the current user
    const currentUserOrders = req.user 
      ? await Order.countDocuments({ user: req.user.id })
      : 0;
    
    // Get sample of recent orders to analyze
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(5)
      .select('_id orderNumber user createdAt')
      .lean();
    
    // Get sample of recent orders for current user
    const currentUserRecentOrders = req.user 
      ? await Order.find({ user: req.user.id })
          .sort('-createdAt')
          .limit(5)
          .select('_id orderNumber user createdAt')
          .lean()
      : [];
    
    // Format user ID for display
    const formatUserIds = (orders) => {
      return orders.map(order => ({
        ...order,
        userIdExists: !!order.user,
        userIdType: order.user ? typeof order.user : 'null',
        userIdValue: order.user ? order.user.toString() : 'null',
      }));
    };
    
    res.status(200).json({
      success: true,
      authenticated: !!req.user,
      currentUserId: req.user ? req.user.id : null,
      stats: {
        totalOrders,
        ordersWithUser,
        ordersWithUserPercentage: (ordersWithUser / totalOrders * 100).toFixed(2) + '%',
        currentUserOrders,
        recentOrders: formatUserIds(recentOrders),
        currentUserRecentOrders: formatUserIds(currentUserRecentOrders)
      },
      message: 'This diagnostic endpoint helps identify issues with user IDs in orders'
    });
  } catch (error) {
    console.error('Error in order diagnostic endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Diagnostic check failed',
      details: error.message
    });
  }
});

// @desc    Create a test order for the authenticated user
// @route   POST /api/v1/orders/create-test
// @access  Private
export const createTestOrder = asyncHandler(async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'You must be logged in to create a test order' 
      });
    }
    
    console.log('Creating test order for user:', req.user.id);
    
    // Generate a unique order number
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${String(10000 + count).padStart(5, '0')}`;

    // Create estimated delivery date (5-7 business days)
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 5 + Math.floor(Math.random() * 3));

    // Create receipt ID
    const receiptId = `RCP-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

    // For test orders, we'll include some sample items
    // We'll use real products from the database with small quantities
    let testItems = [];
    try {
      // Get some random products from database
      const products = await Product.find().limit(2);
      
      if (products.length > 0) {
        testItems = products.map(product => ({
          productId: product._id,
          name: product.name,
          price: product.basePrice,
          quantity: 1, // Just order 1 of each for testing
          image: product.variants?.[0]?.additionalImages?.[0] || '',
          sku: product.sku || '',
          color: product.variants?.[0]?.colorName || '',
          size: product.sizes?.[0] || ''
        }));
      }
    } catch (err) {
      console.log('Could not find products for test order, using dummy data');
      testItems = [
        {
          productId: 'test-product-id',
          name: 'Test Product',
          price: 49.99,
          quantity: 1
        }
      ];
    }
    
    // Create order data object
    const orderData = {
      orderNumber,
      user: req.user.id,
      items: testItems,
      shippingAddress: {
        name: 'Test User',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zip: '12345',
        country: 'Test Country',
        phone: '+1234567890'
      },
      billingAddress: {
        name: 'Test User',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zip: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'Test Payment',
      paymentDetails: {
        transactionId: `txn_test_${Date.now()}`,
        status: 'completed'
      },
      subtotal: testItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 5,
      shipping: 10,
      discount: 0,
      totalAmount: testItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 15, // subtotal + tax + shipping
      status: 'Processing',
      trackingNumber: 'TEST-TRACKING',
      shippingMethod: 'Standard Shipping',
      estimatedDelivery: deliveryDate,
      receiptId,
      customerEmail: 'test@example.com',
      customerName: 'Test User'
    };
    
    // Create the order using the orderData object
    const order = await Order.create(orderData);

    console.log(`Test order created successfully. ID: ${order._id}, User ID set to: ${order.user || 'guest'}`);

    // Update product stock for test orders if using real products
    if (testItems.some(item => item.productId !== 'test-product-id')) {
      const stockUpdateResult = await updateProductStock(testItems);
      console.log('Stock update result for test order:', stockUpdateResult);
    }

    // Import email service here to avoid circular dependencies
    const { sendOrderEmails } = await import('../utils/emailService.js');
    
    // Check if this is a new customer for email personalization
    let isNewCustomer = false;
    if (req.user.id) {
      const userOrderCount = await Order.countDocuments({ user: req.user.id });
      isNewCustomer = userOrderCount <= 1; // This order would be their first
    }
    
    // Prepare response object
    const responseData = {
      success: true,
      data: order,
      emailStatus: { attempted: false }
    };
    
    // Send emails (with a timeout to prevent blocking the response)
    setTimeout(async () => {
      try {
        console.log('Initiating email sending process for order:', order.orderNumber);
        
        // NOTE: In development, if using Resend's default onboarding@resend.dev sender,
        // emails will only be sent to delivered@resend.dev (Resend's test email).
        // In production with a verified domain, this limitation is removed.
        const emailResult = await sendOrderEmails(order, { isNewCustomer });
        
        console.log('Email sending completed with result:', {
          success: emailResult.success,
          customerEmail: emailResult.customerEmail ? 'Attempted' : 'Not attempted',
          adminEmail: emailResult.adminEmail ? 'Attempted' : 'Not attempted'
        });
        
        // If any emails contain a test/ethereal preview URL, log it for testing
        if (emailResult.customerEmail?.previewUrl) {
          console.log('Customer email preview URL:', emailResult.customerEmail.previewUrl);
        }
        if (emailResult.adminEmail?.previewUrl) {
          console.log('Admin email preview URL:', emailResult.adminEmail.previewUrl);
        }
      } catch (emailError) {
        console.error('Uncaught error in email sending process:', emailError);
      }
    }, 100);
    
    // Set a flag to indicate email sending was attempted
    responseData.emailStatus = { 
      attempted: true,
      message: "Order confirmation emails are being processed and will be sent shortly."
    };

    // Return the response immediately without waiting for emails
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating test order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test order',
      details: error.message
    });
  }
});

// @desc    Get all orders (admin only)
// @route   GET /api/v1/orders
// @access  Admin
export const getOrders = asyncHandler(async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Filtering options
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Date range filtering
    if (req.query.startDate) {
      filter.createdAt = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$lte = new Date(req.query.endDate);
    }
    
    // Get orders with pagination
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const total = await Order.countDocuments(filter);
  
  res.status(200).json({
    success: true,
      count: orders.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: orders
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
      details: error.message
    });
  }
});

// @desc    Get fallback orders from file for the authenticated user
// @route   GET /api/v1/orders/fallback
// @access  Private
export const getFallbackOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    console.log(`Retrieving fallback orders for user ${userId}`);
    const result = await getOrdersFromFallback(userId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'No fallback orders found',
        details: result.error
      });
    }
    
    console.log(`Returning ${result.data.length} fallback orders`);
    
    return res.status(200).json({
      success: true,
      message: 'Fallback orders retrieved successfully',
      count: result.data.length,
      timestamp: result.timestamp,
      data: result.data
    });
  } catch (error) {
    console.error('Error retrieving fallback orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve fallback orders',
      details: error.message
    });
  }
});

// @desc    Auth check endpoint (for debugging)
// @route   GET /api/v1/orders/auth-check
// @access  Public
export const authCheck = asyncHandler(async (req, res) => {
  try {
    // Check for token in request
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        message: 'No auth token provided',
        hasToken: false
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(200).json({
          success: true,
          authenticated: false,
          message: 'Valid token but user not found',
          hasToken: true,
          tokenData: {
            id: decoded.id,
            validToken: true,
            userFound: false
          }
        });
      }
      
      // User found with valid token
    return res.status(200).json({
      success: true,
        authenticated: true,
        message: 'User authenticated successfully',
        hasToken: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      });
    } catch (tokenError) {
      // Invalid token
      return res.status(200).json({
        success: true,
        authenticated: false,
        message: 'Invalid or expired token',
        hasToken: true,
        error: tokenError.message
      });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Auth check failed',
      details: error.message
    });
  }
}); 

// @desc    Get order by tracking number or order number (public access)
// @route   GET /api/orders/track/:number
// @access  Public
export const getOrderByTrackingNumber = async (req, res) => {
  try {
    const { number } = req.params;
    
    console.log(`🔍 [orderController] Looking up order with tracking/order number: ${number}`);
    
    if (!number) {
      return res.status(400).json({ 
        success: false, 
        error: 'No tracking number provided' 
      });
    }
    
    // Find by tracking number or order number
    const order = await Order.findOne({
      $or: [
        { trackingNumber: number },
        { orderNumber: number }
      ]
    }).populate('user', 'name email');
    
    if (!order) {
      console.log(`❌ [orderController] No order found for tracking/order number: ${number}`);
      return res.status(404).json({
        success: false,
        error: 'No order found with this tracking/order number'
      });
    }
    
    console.log(`✅ [orderController] Order found for ${number}:`, {
      id: order._id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      status: order.status
    });
    
    // Format response data for front-end consumption
    const responseData = {
      _id: order._id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      estimatedDelivery: order.estimatedDelivery,
      items: order.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        size: item.size,
        color: item.color
      }))
    };
    
    // Only include customer name (not email or other details) for privacy
    if (order.user) {
      responseData.customer = {
        name: order.user.name
      };
    }
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (err) {
    console.error('❌ [orderController] Error looking up order by tracking number:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 