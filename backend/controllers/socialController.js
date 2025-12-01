import SocialLink from '../models/SocialLink.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get all social links
// @route   GET /api/v1/social
// @access  Public
export const getSocialLinks = asyncHandler(async (req, res, next) => {
  const query = { isActive: true };
  
  // If admin is requesting, show all links including inactive ones
  if (req.query.all === 'true' && req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    delete query.isActive;
  }
  
  const links = await SocialLink.find(query).sort({ displayOrder: 1 });
  
  res.status(200).json({
    success: true,
    count: links.length,
    data: links
  });
});

// @desc    Get single social link
// @route   GET /api/v1/social/:id
// @access  Public
export const getSocialLink = asyncHandler(async (req, res, next) => {
  const link = await SocialLink.findById(req.params.id);
  
  if (!link) {
    return next(new ErrorResponse(`Social link not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: link
  });
});

// @desc    Create new social link
// @route   POST /api/v1/social
// @access  Private (Admin only)
export const createSocialLink = asyncHandler(async (req, res, next) => {
  // Check if user is authorized
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to create social links', 401));
  }

  const link = await SocialLink.create(req.body);
  
  res.status(201).json({
    success: true,
    data: link
  });
});

// @desc    Update social link
// @route   PUT /api/v1/social/:id
// @access  Private (Admin only)
export const updateSocialLink = asyncHandler(async (req, res, next) => {
  // Check if user is authorized
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update social links', 401));
  }

  let link = await SocialLink.findById(req.params.id);
  
  if (!link) {
    return next(new ErrorResponse(`Social link not found with id of ${req.params.id}`, 404));
  }
  
  // Update the link
  link = await SocialLink.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: link
  });
});

// @desc    Delete social link
// @route   DELETE /api/v1/social/:id
// @access  Private (Admin only)
export const deleteSocialLink = asyncHandler(async (req, res, next) => {
  // Check if user is authorized
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete social links', 401));
  }

  const link = await SocialLink.findById(req.params.id);
  
  if (!link) {
    return next(new ErrorResponse(`Social link not found with id of ${req.params.id}`, 404));
  }
  
  await link.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
}); 