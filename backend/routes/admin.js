import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { 
  getBasicStats, 
  checkAdminStatus, 
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword
} from '../controllers/adminController.js';

import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  deleteOrder,
  getOrderStats,
  getLightOrders,
  checkOrdersExist,
  clearAllOrders
} from '../controllers/adminOrderController.js';

import { generateReport } from '../controllers/reportController.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// Simplified routes
router.get('/basic-stats', getBasicStats);
router.get('/check-status', checkAdminStatus);

// Test endpoint
router.get('/test', (req, res) => {
  console.log('✅ [admin/test] Test endpoint called');
  res.status(200).json({
    success: true,
    message: 'Admin API is working',
    timestamp: new Date().toISOString()
  });
});

// Admin profile routes
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/update-password', updateAdminPassword);

// Admin order routes
router.get('/orders-check', checkOrdersExist);
router.get('/orders', getAllOrders);
router.get('/orders-light', getLightOrders);
router.get('/orders/stats', getOrderStats);
router.delete('/orders/clear-all', clearAllOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/tracking', updateOrderTracking);
router.delete('/orders/:id', deleteOrder);

// Report routes
router.get('/reports/generate', generateReport);

export default router; 