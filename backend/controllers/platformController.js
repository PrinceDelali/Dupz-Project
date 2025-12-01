import Platform from '../models/Platform.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ErrorResponse from '../utils/errorResponse.js';
import catchAsync from '../utils/catchAsync.js';

// Get all platforms
export const getAllPlatforms = catchAsync(async (req, res) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryObj[field]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Platform.find(JSON.parse(queryStr))
    .populate('featuredProducts'); // Populate featured products
  
  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // Execute query
  const platforms = await query;
  
  // Calculate actual revenue for each platform
  for (let platform of platforms) {
    const stats = await calculatePlatformRevenue(platform._id);
    platform.revenue = stats.revenue;
    platform.salesCount = stats.salesCount;
  }
  
  // Return result
  res.status(200).json({
    status: 'success',
    results: platforms.length,
    data: platforms
  });
});

// Helper function to calculate platform revenue
const calculatePlatformRevenue = async (platformId) => {
  try {
    // Get all products for this platform
    const products = await Product.find({ platformId });
    
    // Get product IDs
    const productIds = products.map(product => product._id);
    
    // Find all orders containing these products
    const orders = await Order.find({
      'items.productId': { $in: productIds }
    });
    
    let totalRevenue = 0;
    let totalSales = 0;
    
    // Calculate revenue from orders
    orders.forEach(order => {
      order.items.forEach(item => {
        // Check if the item belongs to a product from this platform
        if (productIds.some(id => id.toString() === item.productId.toString())) {
          // Add to revenue (price * quantity)
          totalRevenue += (item.price * item.quantity);
          // Count as one sale per item
          totalSales += item.quantity;
        }
      });
    });
    
    return {
      revenue: totalRevenue,
      salesCount: totalSales
    };
  } catch (error) {
    console.error('Error calculating platform revenue:', error);
    return { revenue: 0, salesCount: 0 };
  }
};

// Get platform by ID
export const getPlatform = catchAsync(async (req, res, next) => {
  const platform = await Platform.findById(req.params.id)
    .populate('featuredProducts'); // Populate featured products
  
  if (!platform) {
    return next(new ErrorResponse(`No platform found with that ID`, 404));
  }
  
  // Calculate actual revenue
  const stats = await calculatePlatformRevenue(platform._id);
  platform.revenue = stats.revenue;
  platform.salesCount = stats.salesCount;
  
  res.status(200).json({
    status: 'success',
    data: platform
  });
});

// Create new platform
export const createPlatform = catchAsync(async (req, res, next) => {
  // Add owner information from the authenticated user
  req.body.owner = req.user.id;
  
  const platform = await Platform.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: platform
  });
});

// Update platform
export const updatePlatform = catchAsync(async (req, res, next) => {
  const platform = await Platform.findById(req.params.id);
  
  if (!platform) {
    return next(new ErrorResponse(`No platform found with that ID`, 404));
  }
  
  // Check if user is owner or admin
  if (platform.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`You do not have permission to update this platform`, 403));
  }
  
  // Update the platform
  const updatedPlatform = await Platform.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: updatedPlatform
  });
});

// Delete platform
export const deletePlatform = catchAsync(async (req, res, next) => {
  const platform = await Platform.findById(req.params.id);
  
  if (!platform) {
    return next(new ErrorResponse(`No platform found with that ID`, 404));
  }
  
  // Check if user is owner or admin
  if (platform.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`You do not have permission to delete this platform`, 403));
  }
  
  await Platform.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get my platforms
export const getMyPlatforms = catchAsync(async (req, res, next) => {
  const platforms = await Platform.find({ owner: req.user.id });
  
  res.status(200).json({
    status: 'success',
    results: platforms.length,
    data: platforms
  });
});

// Update platform stats
export const updatePlatformStats = catchAsync(async (req, res, next) => {
  const { salesCount, revenue } = req.body;
  
  const platform = await Platform.findById(req.params.id);
  
  if (!platform) {
    return next(new ErrorResponse(`No platform found with that ID`, 404));
  }
  
  // Check if user is owner or admin
  if (platform.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`You do not have permission to update this platform`, 403));
  }
  
  platform.salesCount = salesCount || platform.salesCount;
  platform.revenue = revenue || platform.revenue;
  
  await platform.save();
  
  res.status(200).json({
    status: 'success',
    data: platform
  });
});

// Get products by platform ID
export const getPlatformProducts = catchAsync(async (req, res, next) => {
  const platform = await Platform.findById(req.params.id);
  
  if (!platform) {
    return next(new ErrorResponse(`No platform found with that ID`, 404));
  }
  
  // Find products with this platform ID
  const products = await Product.find({ platformId: req.params.id });
  
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products
  });
}); 