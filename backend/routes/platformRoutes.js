import express from 'express';
import {
  getAllPlatforms,
  getPlatform,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getMyPlatforms,
  updatePlatformStats,
  getPlatformProducts
} from '../controllers/platformController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllPlatforms);
router.get('/:id', getPlatform);
router.get('/:id/products', getPlatformProducts);

// Protected routes - require authentication
router.use(protect);

router.get('/user/me', getMyPlatforms);

// Restricted to admin and store owners
router.post('/', authorize('admin', 'store-owner'), createPlatform);
router.patch('/:id', authorize('admin', 'store-owner'), updatePlatform);
router.delete('/:id', authorize('admin', 'store-owner'), deletePlatform);
router.patch('/:id/stats', authorize('admin', 'store-owner'), updatePlatformStats);

export default router; 