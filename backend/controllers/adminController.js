import asyncHandler from '../middleware/async.js';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get basic admin stats
// @route   GET /api/v1/admin/basic-stats
// @access  Private/Admin
export const getBasicStats = asyncHandler(async (req, res) => {
  try {
    // Get total users
    const userCount = await User.countDocuments();
    console.log('Total users:', userCount); // Debug log

    // Get today's users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: today }
    });

    // Get active users in last 24 hours
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });

    // Get recent users with all required fields
    const recentUsers = await User.find()
      .select('firstName lastName email isVerified createdAt')
      .sort('-createdAt')
      .limit(10);

    // Generate growth data
    const userGrowth = await generateUserGrowthData();
    console.log('User growth data:', userGrowth); // Debug log

    // Generate activity data
    const userActivity = await generateUserActivityData();
    console.log('User activity data:', userActivity); // Debug log

    // Send response
    res.status(200).json({
      success: true,
      data: {
        userCount,
        todayUsers,
        activeUsers,
        recentUsers,
        userGrowth,
        userActivity
      }
    });
  } catch (error) {
    console.error('Stats generation error:', error);
    throw new ErrorResponse('Error generating admin stats', 500);
  }
});

// Optimize the user growth data generation
const generateUserGrowthData = async () => {
  const days = 7;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await User.countDocuments({
      createdAt: {
        $gte: date,
        $lt: nextDate
      }
    });

    data.unshift({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: count || 0 // Ensure we always have a number
    });
  }
  return data;
};

// Optimize the user activity data generation
const generateUserActivityData = async () => {
  const hours = 24;
  const data = [];
  const now = new Date();

  for (let i = 0; i < hours; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() - i);
    time.setMinutes(0, 0, 0);

    const nextHour = new Date(time);
    nextHour.setHours(nextHour.getHours() + 1);

    const active = await User.countDocuments({
      lastActive: {
        $gte: time,
        $lt: nextHour
      }
    });

    data.unshift({
      time: `${time.getHours()}:00`,
      active: active || 0 // Ensure we always have a number
    });
  }
  return data;
};

// @desc    Check admin status
// @route   GET /api/v1/admin/check-status
// @access  Private/Admin
export const checkAdminStatus = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access confirmed'
  });
});

// @desc    Get admin profile
// @route   GET /api/v1/admin/profile
// @access  Private/Admin
export const getAdminProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update admin profile
// @route   PUT /api/v1/admin/profile
// @access  Private/Admin
export const updateAdminProfile = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;
  
  await user.save();
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update admin password
// @route   PUT /api/v1/admin/update-password
// @access  Private/Admin
export const updateAdminPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Check if current password matches
  const isMatch = await user.matchPassword(currentPassword);
  
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }
  
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
}); 