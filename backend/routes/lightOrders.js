import express from 'express';
import { getLightOrders, createLightTestOrder } from '../controllers/lightOrderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

console.log('Initializing lightweight orders routes...');

// GET /api/v1/light-orders - Get orders with minimal processing
router.get('/', protect, getLightOrders);

// POST /api/v1/light-orders/create-test - Create test orders
router.post('/create-test', protect, createLightTestOrder);

// Add a health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lightweight orders API is operational',
    timestamp: new Date().toISOString()
  });
});

console.log('Lightweight orders routes initialized successfully!');

export default router; 