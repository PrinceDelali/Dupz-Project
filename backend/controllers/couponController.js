import Coupon from '../models/Coupon.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
// import AppError from '../utils/appError.js';
// import catchAsync from '../utils/catchAsync.js';

// Create a new coupon
export const createCoupon = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Check if a coupon with the same code already exists
  const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
  if (existingCoupon) {
    return res.status(400).json({
      success: false,
      message: 'A coupon with this code already exists'
    });
  }

  // Create the coupon
  const coupon = new Coupon({
    ...req.body,
    code: req.body.code.toUpperCase(), // Ensure code is uppercase
  });

  await coupon.save();

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: coupon
  });
});

// Get all coupons (with optional filters)
export const getAllCoupons = asyncHandler(async (req, res) => {
  const { isActive, discountType, search } = req.query;
  
  // Build filter object
  const filter = {};
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  if (discountType) {
    filter.discountType = discountType;
  }
  
  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: coupons.length,
    data: coupons
  });
});

// Get a specific coupon by ID
export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: coupon
  });
});

// Validate a coupon code
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, totalAmount } = req.body;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code is required'
    });
  }
  
  // Find the coupon (case insensitive)
  const coupon = await Coupon.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });
  
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Invalid or expired coupon code'
    });
  }
  
  // Check if usage limit is reached
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'Coupon usage limit reached'
    });
  }
  
  // Check minimum purchase amount
  if (totalAmount && coupon.minPurchaseAmount > 0 && totalAmount < coupon.minPurchaseAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum purchase amount of GH₵${coupon.minPurchaseAmount} required`
    });
  }
  
  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (totalAmount * coupon.discountValue) / 100;
    
    // Apply max discount if specified
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    // Fixed amount discount
    discount = coupon.discountValue;
  }
  
  res.status(200).json({
    success: true,
    message: 'Coupon is valid',
    data: {
      coupon,
      discount: parseFloat(discount.toFixed(2))
    }
  });
});

// Update a coupon
export const updateCoupon = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  // Check if code is being changed and if it already exists
  if (req.body.code) {
    const existingCoupon = await Coupon.findOne({ 
      code: req.body.code.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'A coupon with this code already exists'
      });
    }
  }
  
  // Update with the modified data
  const updatedData = { ...req.body };
  if (req.body.code) {
    updatedData.code = req.body.code.toUpperCase();
  }
  
  // Set updated timestamp
  updatedData.updatedAt = new Date();
  
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    updatedData,
    { new: true, runValidators: true }
  );
  
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: coupon
  });
});

// Delete a coupon
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully'
  });
});

// Toggle coupon activation status
export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }
  
  // Toggle the isActive status
  coupon.isActive = !coupon.isActive;
  coupon.updatedAt = new Date();
  await coupon.save();
  
  res.status(200).json({
    success: true,
    message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
    data: coupon
  });
});

// Apply coupon to an order (increment usage count)
export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.body;
  
  if (!couponId) {
    return res.status(400).json({
      success: false,
      message: 'Coupon ID is required'
    });
  }
  
  const coupon = await Coupon.findById(couponId);
  
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }
  
  // Increment usage count
  coupon.usageCount += 1;
  await coupon.save();
  
  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    data: coupon
  });
}); 