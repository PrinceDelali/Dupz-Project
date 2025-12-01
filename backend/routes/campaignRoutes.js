import express from 'express';
import * as campaignController from '../controllers/campaignController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public tracking routes (no auth required)
router.get('/track-open/:id', campaignController.trackEmailOpen);
router.get('/track-click/:id', campaignController.trackEmailClick);

// Protect all routes after this middleware
router.use(protect);

// Admin only routes
router.use(authorize('admin'));

// Campaign statistics
router.get('/stats', campaignController.getCampaignStats);

// CRUD operations
router
  .route('/')
  .get(campaignController.getAllCampaigns)
  .post(campaignController.createCampaign);

router
  .route('/:id')
  .get(campaignController.getCampaign)
  .patch(campaignController.updateCampaign)
  .delete(campaignController.deleteCampaign);

// Send campaign
router.post('/:id/send', campaignController.sendCampaign);

export default router; 