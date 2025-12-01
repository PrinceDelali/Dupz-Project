import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Simple in-memory cache for frequently requested data
const cache = {
  users: new Map(), // Map of query strings to response data
  lastCleaned: Date.now()
};

// Cache helpers
const getCacheKey = (query, page, limit) => {
  return `${JSON.stringify(query)}_${page}_${limit}`;
};

const getCachedUsers = (query, page, limit) => {
  const key = getCacheKey(query, page, limit);
  const cachedData = cache.users.get(key);
  
  if (cachedData && (Date.now() - cachedData.timestamp < 60000)) { // 1 minute cache
    console.log(`[USER CONTROLLER] Cache hit for query: ${key}`);
    return cachedData.data;
  }
  
  return null;
};

const setCachedUsers = (query, page, limit, data) => {
  const key = getCacheKey(query, page, limit);
  
  // Clean cache if it's been more than 5 minutes
  if (Date.now() - cache.lastCleaned > 300000) { // 5 minutes
    console.log(`[USER CONTROLLER] Cleaning cache`);
    // Remove entries older than 2 minutes
    for (const [cacheKey, cacheEntry] of cache.users.entries()) {
      if (Date.now() - cacheEntry.timestamp > 120000) { // 2 minutes
        cache.users.delete(cacheKey);
      }
    }
    cache.lastCleaned = Date.now();
  }
  
  // Store in cache
  cache.users.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`[USER CONTROLLER] Cached data for query: ${key}`);
};

// @desc    Get all users with pagination, search and caching
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  console.log(`[USER CONTROLLER] Fetching users - Request received - ${new Date().toISOString()}`);
  const requestId = Date.now().toString(); // Unique ID for this request
  console.log(`[USER CONTROLLER] Request ID: ${requestId}`);
  
  // Check if the request was directly from a browser (no Authorization header)
  if (!req.headers.authorization) {
    console.log(`[USER CONTROLLER][${requestId}] Direct browser access detected - no auth token`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }
  
  try {
    // Get pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    console.log(`[USER CONTROLLER] Query params - page: ${page}, limit: ${limit}, search: "${search}"`);
    
    // Build query with search capability
    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      console.log(`[USER CONTROLLER] Search query built: ${JSON.stringify(query)}`);
    }
    
    // Check memory cache first
    const cachedResult = getCachedUsers(query, page, limit);
    if (cachedResult) {
      console.log(`[USER CONTROLLER][${requestId}] Returning cached result`);
      
      // Add cache control headers
      res.set('Cache-Control', 'private, max-age=60'); // Client cache for 1 minute
      res.set('X-Cache-Source', 'memory');
      
      return res.status(200).json(cachedResult);
    }
    
    // Add cache control headers for response
    res.set('Cache-Control', 'private, max-age=300'); // Client cache for 5 minutes
    res.set('X-Cache-Source', 'database');
    
    console.log(`[USER CONTROLLER][${requestId}] Attempting to fetch users from MongoDB`);
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database query timed out after 10 seconds'));
      }, 10000); // 10 second timeout
    });
    
    // Fetch users from MongoDB with only required fields
    const usersPromise = User.find(query)
      .select('firstName lastName email createdAt role permissions') // Added permissions
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    // Get total count for pagination
    const countPromise = User.countDocuments(query);
    
    // Execute both promises in parallel with a timeout
    const [users, total] = await Promise.race([
      Promise.all([usersPromise, countPromise]),
      timeoutPromise
    ]).catch(err => {
      console.error(`[USER CONTROLLER][${requestId}] MongoDB query failed: ${err.message}`);
      console.error(err.stack);
      throw new Error(`Failed to fetch users: ${err.message}`);
    });
    
    console.log(`[USER CONTROLLER][${requestId}] Successfully retrieved ${users.length} users out of ${total} total matching records`);
    
    // Simplify user objects to just the fields we need
    const simplifiedUsers = users.map(user => {
      const userData = user.toObject();
      return {
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions,
        createdAt: userData.createdAt
      };
    });
    
    // Create response object
    const responseData = {
      success: true,
      data: simplifiedUsers,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
    
    // Store in memory cache
    setCachedUsers(query, page, limit, responseData);
    
    // Return response with metadata
    res.status(200).json(responseData);
    
    console.log(`[USER CONTROLLER][${requestId}] Response sent successfully - ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`[USER CONTROLLER] Error in getUsers: ${error.message}`);
    console.error(error.stack);
    
    // Check for specific MongoDB errors
    if (error.name === 'MongoServerError') {
      res.status(500).json({
        success: false,
        message: 'Database server error',
        error: error.message
      });
    } else if (error.message.includes('timed out')) {
      res.status(504).json({
        success: false,
        message: 'Database request timed out',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
  }
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  console.log(`[USER CONTROLLER] Fetching single user with ID: ${userId}`);
  
  try {
    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`[USER CONTROLLER] Invalid user ID format: ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    console.log(`[USER CONTROLLER] Querying MongoDB for user: ${userId}`);
    const user = await User.findById(userId).select('firstName lastName email role permissions createdAt');
    
    if (!user) {
      console.log(`[USER CONTROLLER] User not found with ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`[USER CONTROLLER] User found: ${user.email}`);
    
    // Add cache control
    res.set('Cache-Control', 'private, max-age=300');
    
    res.status(200).json({
      success: true,
      data: user
    });
    
    console.log(`[USER CONTROLLER] User details sent successfully - ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`[USER CONTROLLER] Error fetching user ${userId}: ${error.message}`);
    console.error(error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving user details',
      error: error.message
    });
  }
});

// @desc    Create a new admin or staff user
// @route   POST /api/v1/users/admin
// @access  Private/Admin
export const createAdminUser = asyncHandler(async (req, res) => {
  console.log(`[USER CONTROLLER] Creating new admin/staff user`);
  
  try {
    // Extract user data from request body
    const { firstName, lastName, email, password, role, permissions = [] } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password'
      });
    }
    
    // Validate role
    if (!['admin', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "admin" or "staff"'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      permissions,
      isVerified: true, // Auto-verify admin/staff accounts
      createdBy: req.user.id // Track who created this user
    });
    
    // Clear user cache when a new user is added
    cache.users.clear();
    
    console.log(`[USER CONTROLLER] Created new ${role} user: ${email}`);
    
    // Return success without exposing password
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(`[USER CONTROLLER] Error creating admin/staff user: ${error.message}`);
    console.error(error.stack);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  console.log(`[USER CONTROLLER] Updating user: ${req.params.id}`);
  
  try {
    // Validate userId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`[USER CONTROLLER] Invalid user ID format: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find user to update
    const user = await User.findById(req.params.id);
  
  if (!user) {
      console.log(`[USER CONTROLLER] User not found with ID: ${req.params.id}`);
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
    // Extract allowed fields to update
    const { firstName, lastName, email, role, permissions } = req.body;
    
    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    
    // Admin can update role and permissions
    if (req.user.role === 'admin') {
      if (role) {
        // Validate role
        if (!['user', 'staff', 'admin'].includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'Role must be "user", "staff", or "admin"'
          });
        }
        user.role = role;
      }
      
      // Update permissions array if provided (only relevant for staff users)
      if (permissions) {
        if (Array.isArray(permissions)) {
          user.permissions = permissions;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Permissions must be an array of menu item identifiers'
          });
        }
      }
    } else {
      console.log(`[USER CONTROLLER] Non-admin user attempted to update role/permissions`);
    }
    
    // Save the updated user
    await user.save();
    
    // Clear user cache to reflect updates
    cache.users.clear();
    
    console.log(`[USER CONTROLLER] User updated successfully: ${user.email}`);
    
    // Return success
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error(`[USER CONTROLLER] Error updating user: ${error.message}`);
    console.error(error.stack);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({
        success: false,
        message: 'Email already in use by another account'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  console.log(`[USER CONTROLLER] Deleting user: ${req.params.id}`);
  
  try {
    // Validate userId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`[USER CONTROLLER] Invalid user ID format: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Check if trying to delete self
    if (req.params.id === req.user.id) {
      console.log(`[USER CONTROLLER] User attempted to delete themselves: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // Find and delete the user
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      console.log(`[USER CONTROLLER] User not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Clear user cache after deletion
    cache.users.clear();
    
    console.log(`[USER CONTROLLER] User deleted successfully: ${user.email}`);
    
    // Return success
  res.status(200).json({
    success: true,
      data: {}
    });
  } catch (error) {
    console.error(`[USER CONTROLLER] Error deleting user: ${error.message}`);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
}); 