import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import asyncHandler from '../middleware/asyncHandler.js';

// Get file path for fallback orders cache
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackOrdersDir = path.join(__dirname, '../temp');
const fallbackOrdersFile = path.join(fallbackOrdersDir, 'light_orders_fallback.json');

// Ensure temp directory exists
try {
  if (!fs.existsSync(fallbackOrdersDir)) {
    fs.mkdirSync(fallbackOrdersDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create fallback directory:', err);
}

/**
 * @desc    Get user orders with minimal processing
 * @route   GET /api/v1/light-orders
 * @access  Private
 */
export const getLightOrders = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  
  try {
    // 1. Validate user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    console.log(`[Light Orders] Fetching orders for user ${userId}`);
    
    // 2. Database connection check
    if (mongoose.connection.readyState !== 1) {
      console.log('[Light Orders] MongoDB not connected, using fallback');
      return await sendFallbackResponse(userId, res);
    }
    
    // 3. Set a timeout for the database query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out')), 2000);
    });
    
    // 4. Execute the query directly using the connection for maximum performance
    const queryPromise = new Promise(async (resolve) => {
      try {
        // Use raw connection for better performance instead of Mongoose model
        const db = mongoose.connection.db;
        const collection = db.collection('orders');
        
        // Perform a simple find using direct MongoDB driver
        const orders = await collection.find({ user: new mongoose.Types.ObjectId(userId) })
          .project({ 
            orderNumber: 1, 
            status: 1,
            totalAmount: 1,
            createdAt: 1,
            items: 1
          })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray();
        
        resolve(orders);
      } catch (error) {
        console.error('[Light Orders] Error in direct query:', error.message);
        resolve([]);
      }
    });
    
    // 5. Race between timeout and database query
    const orders = await Promise.race([queryPromise, timeoutPromise])
      .catch(async (error) => {
        console.error(`[Light Orders] Query failed: ${error.message}`);
        // If query times out or fails, try fallback
        return [];
      });
    
    // 6. If we got orders, use them and update the fallback
    if (orders && orders.length > 0) {
      const endTime = performance.now();
      console.log(`[Light Orders] Found ${orders.length} orders in ${(endTime - startTime).toFixed(2)}ms`);
      
      // Save to fallback for next time
      await saveFallback(userId, orders);
      
      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
        processingTime: (endTime - startTime).toFixed(2)
      });
    }
    
    // 7. Try fallback if query returned no results
    console.log('[Light Orders] No orders found, trying fallback');
    return await sendFallbackResponse(userId, res);
    
  } catch (error) {
    console.error(`[Light Orders] Error: ${error.message}`);
    return await sendFallbackResponse(req.user?.id, res, error.message);
  }
});

/**
 * Save orders to fallback file
 */
const saveFallback = async (userId, orders) => {
  try {
    // Create a map of users to their orders
    let allOrders = {};
    
    // Read existing file if it exists
    if (fs.existsSync(fallbackOrdersFile)) {
      try {
        const fileContent = fs.readFileSync(fallbackOrdersFile, 'utf8');
        allOrders = JSON.parse(fileContent);
      } catch (err) {
        console.error('[Light Orders] Error reading fallback file:', err.message);
        allOrders = {};
      }
    }
    
    // Update with new orders
    allOrders[userId] = {
      timestamp: new Date().toISOString(),
      orders: orders.map(order => ({
        ...order,
        _id: order._id.toString() // Convert ObjectId to string for storage
      }))
    };
    
    // Write back to file
    fs.writeFileSync(
      fallbackOrdersFile, 
      JSON.stringify(allOrders, null, 2),
      'utf8'
    );
    
    console.log(`[Light Orders] Saved ${orders.length} orders to fallback for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[Light Orders] Failed to save fallback:', error.message);
    return false;
  }
};

/**
 * Get orders from fallback and send response
 */
const sendFallbackResponse = async (userId, res, errorMessage = null) => {
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  try {
    // Check if fallback file exists
    if (!fs.existsSync(fallbackOrdersFile)) {
      return res.status(404).json({
        success: false,
        error: 'No orders found',
        details: 'No fallback data available'
      });
    }
    
    // Read from fallback file
    const fileContent = fs.readFileSync(fallbackOrdersFile, 'utf8');
    const allOrders = JSON.parse(fileContent);
    
    // Check if user has orders in fallback
    if (!allOrders[userId]) {
      return res.status(404).json({
        success: false,
        error: 'No orders found for this user',
        details: 'No fallback data for this user'
      });
    }
    
    console.log(`[Light Orders] Retrieved ${allOrders[userId].orders.length} orders from fallback`);
    
    return res.status(200).json({
      success: true,
      fromFallback: true,
      fallbackTimestamp: allOrders[userId].timestamp,
      count: allOrders[userId].orders.length,
      data: allOrders[userId].orders,
      message: 'Using cached orders data',
      originalError: errorMessage
    });
  } catch (error) {
    console.error('[Light Orders] Fallback retrieval error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
      details: 'Both main query and fallback failed'
    });
  }
};

/**
 * @desc    Create test orders for fallback testing
 * @route   POST /api/v1/light-orders/create-test
 * @access  Private
 */
export const createLightTestOrder = asyncHandler(async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    
    // Create sample test orders directly for the fallback
    const testOrders = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        orderNumber: `TEST-${Date.now()}`,
        status: 'Processing',
        totalAmount: 99.99,
        createdAt: new Date().toISOString(),
        items: [
          {
            name: 'Test Product 1',
            price: 49.99,
            quantity: 1
          },
          {
            name: 'Test Product 2',
            price: 29.99,
            quantity: 2
          }
        ]
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        orderNumber: `TEST-${Date.now() + 1}`,
        status: 'Shipped',
        totalAmount: 149.99,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        items: [
          {
            name: 'Premium Test Product',
            price: 149.99,
            quantity: 1
          }
        ]
      }
    ];
    
    // Save to fallback
    let allOrders = {};
    
    // Read existing file if it exists
    if (fs.existsSync(fallbackOrdersFile)) {
      try {
        const fileContent = fs.readFileSync(fallbackOrdersFile, 'utf8');
        allOrders = JSON.parse(fileContent);
      } catch (err) {
        console.error('[Light Orders] Error reading fallback file:', err.message);
        allOrders = {};
      }
    }
    
    // Update with new test orders
    allOrders[userId] = {
      timestamp: new Date().toISOString(),
      orders: testOrders
    };
    
    // Write back to file
    fs.writeFileSync(
      fallbackOrdersFile, 
      JSON.stringify(allOrders, null, 2),
      'utf8'
    );
    
    console.log(`[Light Orders] Created ${testOrders.length} test orders for user ${userId}`);
    
    return res.status(201).json({
      success: true,
      message: 'Test orders created successfully in fallback',
      count: testOrders.length,
      data: testOrders
    });
  } catch (error) {
    console.error('[Light Orders] Test order creation error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to create test orders',
      details: error.message
    });
  }
}); 