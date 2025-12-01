import InstagramImage from '../models/InstagramImage.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get all instagram images
// @route   GET /api/v1/instagram
// @access  Public
export const getInstagramImages = asyncHandler(async (req, res, next) => {
  const query = { isActive: true };
  
  // If admin is requesting, show all images including inactive ones
  if (req.query.all === 'true' && req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    delete query.isActive;
  }
  
  const images = await InstagramImage.find(query).sort({ displayOrder: 1 });
  
  res.status(200).json({
    success: true,
    count: images.length,
    data: images
  });
});

// @desc    Create new instagram image
// @route   POST /api/v1/instagram
// @access  Private (Admin only)
export const createInstagramImage = asyncHandler(async (req, res, next) => {
  // Check if user is authorized
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to create Instagram images', 401));
  }

  const image = await InstagramImage.create(req.body);
  
  res.status(201).json({
    success: true,
    data: image
  });
});

// @desc    Update instagram image
// @route   PUT /api/v1/instagram/:id
// @access  Private (Admin only)
export const updateInstagramImage = asyncHandler(async (req, res, next) => {
  // Check if user is authorized
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update Instagram images', 401));
  }

  let image = await InstagramImage.findById(req.params.id);
  
  if (!image) {
    return next(new ErrorResponse(`Instagram image not found with id of ${req.params.id}`, 404));
  }
  
  // Update the image
  image = await InstagramImage.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: image
  });
});

// @desc    Delete instagram image
// @route   DELETE /api/v1/instagram/:id
// @access  Private (Admin only)
export const deleteInstagramImage = asyncHandler(async (req, res, next) => {
  // Check if user is authorized
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete Instagram images', 401));
  }

  const image = await InstagramImage.findById(req.params.id);
  
  if (!image) {
    return next(new ErrorResponse(`Instagram image not found with id of ${req.params.id}`, 404));
  }
  
  await image.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get single instagram image
// @route   GET /api/v1/instagram/:id
// @access  Public
export const getInstagramImage = asyncHandler(async (req, res, next) => {
  const image = await InstagramImage.findById(req.params.id);
  
  if (!image) {
    return next(new ErrorResponse(`Instagram image not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: image
  });
}); 