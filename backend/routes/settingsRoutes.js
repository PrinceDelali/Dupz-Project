import express from 'express';
import {
  getSettings,
  updateSettings,
  getShippingMethods,
  updateShippingMethods,
  getTaxRates,
  updateTaxRates,
  updateDefaultTaxRate,
  getBanners,
  updateBanners,
  updateBannerByType
} from '../controllers/settingsController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getSettings);
router.get('/shipping', getShippingMethods);
router.get('/tax', getTaxRates);
router.get('/banners', getBanners);

// Admin routes 
router.put('/', protect, authorize('admin'), updateSettings);
router.put('/shipping', protect, authorize('admin'), updateShippingMethods);
router.put('/tax', protect, authorize('admin'), updateTaxRates);
router.put('/tax/default', protect, authorize('admin'), updateDefaultTaxRate);
router.put('/banners', protect, authorize('admin'), updateBanners);
router.put('/banners/:type', protect, authorize('admin'), updateBannerByType);

export default router; 