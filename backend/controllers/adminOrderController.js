import Order from '../models/Order.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all orders
 * @route   GET /api/v1/admin/orders
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res) => {
  console.log('🔍 [getAllOrders] API endpoint called');
  
  try {
    // Extract pagination parameters from query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Extract filter parameters
    const status = req.query.status && req.query.status !== 'all' 
      ? req.query.status 
      : null;
    
    const search = req.query.search || '';
    
    // Build query object
    const queryObj = {};
    
    // Add status filter if provided
    if (status) {
      queryObj.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      queryObj.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('🔍 [getAllOrders] Query object:', queryObj);
    console.log(`🔍 [getAllOrders] Pagination: page=${page}, limit=${limit}, startIndex=${startIndex}`);
    
    // Use direct mongoose connection - same approach as in database.js
    const db = mongoose.connection.db;
    
    // Check if collection exists
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === 'orders');
    
    if (!collectionExists) {
      console.log('⚠️ [getAllOrders] Orders collection does not exist');
      return res.status(200).json({
        success: true,
        count: 0,
        pagination: {
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        data: []
      });
    }
    
    // Get the orders collection
    const collection = db.collection('orders');
    
    // Execute count using direct collection method
    console.log('🔍 [getAllOrders] Counting documents using direct collection access');
    const total = await collection.countDocuments(queryObj);
    console.log(`✅ [getAllOrders] Total documents count: ${total}`);
    
    // Execute main query with pagination
    console.log('🔍 [getAllOrders] Fetching documents using direct collection access');
    const projection = {
      orderNumber: 1,
      customerName: 1,
      customerEmail: 1,
      status: 1,
      totalAmount: 1,
      items: 1,
      createdAt: 1,
      trackingNumber: 1
    };
    
    const orders = await collection.find(queryObj)
      .project(projection)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .toArray();
      
    console.log(`✅ [getAllOrders] Successfully retrieved ${orders.length} orders out of ${total} total`);
    
    // Calculate pagination details
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Map orders data to include items count
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      totalAmount: order.totalAmount,
      items: Array.isArray(order.items) ? order.items.length : 0,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber
    }));
    
    // Send paginated response
    res.status(200).json({
      success: true,
      count: total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      data: formattedOrders
    });
    
    console.log('📤 [getAllOrders] Response sent to client');
  } catch (error) {
    console.error('❌ [getAllOrders] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error fetching orders'
    });
    console.log('📤 [getAllOrders] Error response sent to client');
  }
};

/**
 * @desc    Get a single order by ID
 * @route   GET /api/v1/admin/orders/:id
 * @access  Private/Admin
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching order'
    });
  }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/v1/admin/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    // Find the order and update its status
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating order status'
    });
  }
};

/**
 * @desc    Update order tracking information
 * @route   PATCH /api/v1/admin/orders/:id/tracking
 * @access  Private/Admin
 */
export const updateOrderTracking = async (req, res) => {
  try {
    const { trackingNumber, shippingMethod, estimatedDelivery } = req.body;
    
    // Create update object with provided fields
    const updateData = {};
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingMethod) updateData.shippingMethod = shippingMethod;
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);
    
    // Find the order and update its tracking info
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating order tracking'
    });
  }
};

/**
 * @desc    Delete an order
 * @route   DELETE /api/v1/admin/orders/:id
 * @access  Private/Admin
 */
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting order'
    });
  }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/v1/admin/orders/stats
 * @access  Private/Admin
 */
export const getOrderStats = async (req, res) => {
  try {
    // Get total number of orders
    const totalOrders = await Order.countDocuments();
    
    // Get total revenue
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Get orders by status
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get orders in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get revenue from orders in the last 7 days
    const recentRevenueResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const recentRevenue = recentRevenueResult.length > 0 ? recentRevenueResult[0].total : 0;
    
    // Format the status counts as an object
    const statusCountsObj = {};
    statusCounts.forEach(item => {
      statusCountsObj[item._id] = item.count;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        statusCounts: statusCountsObj,
        recentOrders,
        recentRevenue
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting order statistics'
    });
  }
};

/**
 * @desc    Get all orders (lightweight version - direct MongoDB access)
 * @route   GET /api/v1/admin/orders-light
 * @access  Private/Admin
 */
export const getLightOrders = async (req, res) => {
  console.log('🔍 [getLightOrders] API endpoint called - using direct MongoDB access');
  
  try {
    // Extract pagination parameters from query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Extract filter parameters
    const status = req.query.status && req.query.status !== 'all' 
      ? req.query.status 
      : null;
    
    const search = req.query.search || '';
    
    // Build query object
    const queryObj = {};
    
    // Add status filter if provided
    if (status) {
      queryObj.status = status;
    }
    
    // Add search filter if provided (simplified for performance)
    if (search) {
      queryObj.orderNumber = { $regex: search, $options: 'i' };
    }
    
    console.log('🔍 [getLightOrders] Query object:', queryObj);
    
    // Use direct mongoose connection - same approach as in database.js
    const db = mongoose.connection.db;
    
    // Make sure the collection exists
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === 'orders');
    
    if (!collectionExists) {
      console.log('⚠️ [getLightOrders] Orders collection does not exist');
      return res.status(200).json({
        success: true,
        count: 0,
        pagination: {
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        data: []
      });
    }
    
    // Get the orders collection
    const ordersCollection = db.collection('orders');
    
    // Get count using countDocuments for consistency
    let total = await ordersCollection.countDocuments(queryObj);
    
    console.log(`✅ [getLightOrders] Total order count: ${total}`);
    
    // Minimal projection for better performance
    const projection = {
      _id: 1,
      orderNumber: 1,
      customerName: 1,
      customerEmail: 1,
      status: 1,
      totalAmount: 1,
      items: 1, // Need full items array to count them
      createdAt: 1,
      trackingNumber: 1
    };
    
    // Execute query with minimal data
    const orders = await ordersCollection.find(queryObj)
      .project(projection)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .toArray();
    
    console.log(`✅ [getLightOrders] Retrieved ${orders.length} orders`);
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Map the results to a consistent format
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      totalAmount: order.totalAmount,
      items: Array.isArray(order.items) ? order.items.length : 0,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber
    }));
    
    // Send response
    res.status(200).json({
      success: true,
      count: total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      data: formattedOrders
    });
    
  } catch (error) {
    console.error('❌ [getLightOrders] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error fetching orders'
    });
  }
};

/**
 * @desc    Check if orders exist and get basic collection stats
 * @route   GET /api/v1/admin/orders-check
 * @access  Private/Admin
 */
export const checkOrdersExist = async (req, res) => {
  console.log('🔍 [checkOrdersExist] Checking if orders collection exists');
  
  try {
    // Use mongoose connection directly - same approach as in database.js
    const db = mongoose.connection.db;
    
    // Check if collection exists
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === 'orders');
    
    console.log(`🔍 [checkOrdersExist] Collections in database:`, collections.map(c => c.name));
    console.log(`🔍 [checkOrdersExist] Orders collection exists: ${collectionExists}`);
    
    if (!collectionExists) {
      console.log('⚠️ [checkOrdersExist] Orders collection does not exist');
      return res.status(200).json({
        success: true,
        exists: false,
        count: 0
      });
    }
    
    // Get estimate of total orders with direct MongoDB access
    const ordersCollection = db.collection('orders');
    const estimatedCount = await ordersCollection.countDocuments();
    
    console.log(`✅ [checkOrdersExist] Orders collection exists with ${estimatedCount} documents`);
    
    // Get a sample order if available
    let sampleOrder = null;
    if (estimatedCount > 0) {
      const sampleOrders = await ordersCollection.find()
        .limit(1)
        .project({
          _id: 1,
          orderNumber: 1,
          customerName: 1,
          createdAt: 1
        })
        .toArray();
        
      if (sampleOrders.length > 0) {
        sampleOrder = sampleOrders[0];
      }
    }
    
    res.status(200).json({
      success: true,
      exists: true,
      count: estimatedCount,
      sampleOrder
    });
    
  } catch (error) {
    console.error('❌ [checkOrdersExist] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error checking orders collection'
    });
  }
}; 

/**
 * @desc    Clear all orders from the database
 * @route   DELETE /api/v1/admin/orders/clear-all
 * @access  Private/Admin
 */
export const clearAllOrders = async (req, res) => {
  console.log('⚠️ [clearAllOrders] Clear all orders requested by admin');
  
  try {
    // Use direct mongoose connection for better performance
    const db = mongoose.connection.db;
    
    // Check if collection exists
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === 'orders');
    
    if (!collectionExists) {
      console.log('⚠️ [clearAllOrders] Orders collection does not exist');
      return res.status(200).json({
        success: true,
        message: 'No orders collection exists, nothing to clear'
      });
    }
    
    // Get the count of orders before deletion for reporting
    const ordersCount = await Order.countDocuments({});
    console.log(`⚠️ [clearAllOrders] Preparing to delete ${ordersCount} orders`);
    
    // Delete all orders using the deleteMany method
    const result = await Order.deleteMany({});
    
    console.log(`✅ [clearAllOrders] Successfully deleted ${result.deletedCount} orders`);
    
    // Return success with the count of deleted items
    res.status(200).json({
      success: true,
      message: `Successfully cleared all orders`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ [clearAllOrders] Error clearing orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error clearing orders database'
    });
  }
}; 