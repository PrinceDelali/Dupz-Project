import express from 'express';
import { body } from 'express-validator';
import * as couponController from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware for coupon creation/update
const couponValidation = [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be either percentage or fixed'),
  body('discountValue').isNumeric().withMessage('Discount value must be a number'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date')
];

// Admin-only routes
router
  .route('/admin/coupons')
  .get(protect, authorize('admin'), couponController.getAllCoupons)
  .post(protect, authorize('admin'), couponValidation, couponController.createCoupon);

router
  .route('/admin/coupons/:id')
  .get(protect, authorize('admin'), couponController.getCouponById)
  .put(protect, authorize('admin'), couponValidation, couponController.updateCoupon)
  .delete(protect, authorize('admin'), couponController.deleteCoupon);

router
  .route('/admin/coupons/:id/toggle-status')
  .patch(protect, authorize('admin'), couponController.toggleCouponStatus);

// Public and customer routes
router.post('/coupons/validate', couponController.validateCoupon);
router.post('/coupons/apply', protect, couponController.applyCoupon);

export default router; 