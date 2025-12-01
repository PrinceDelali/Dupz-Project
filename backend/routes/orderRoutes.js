import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrderById,
  getOrderByTrackingNumber,
  updateOrder, 
  deleteOrder, 
  getOrdersByUser, 
  generateTestOrders,
  getOrderDetails
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to check order status by tracking or order number
router.get('/track/:number', getOrderByTrackingNumber);

// @desc    Fetch all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, getOrders);

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public (allows both authenticated and guest checkouts)
router.post('/', createOrder);

// @desc    Fetch single order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, getOrderById);

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
router.put('/:id', protect, admin, updateOrder);

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteOrder);

// @desc    Get logged in user orders
// @route   GET /api/orders/user/:userId
// @access  Private
router.get('/user/:userId', protect, getOrdersByUser);

// @desc    Get detailed order data
// @route   GET /api/orders/:id/details
// @access  Private or admin
router.get('/:id/details', getOrderDetails);

// Generate test orders for development only
if (process.env.NODE_ENV === 'development') {
  router.post('/generate-test', generateTestOrders);
}

export default router; 