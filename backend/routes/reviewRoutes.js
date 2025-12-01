import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getReview,
  updateReview,
  deleteReview,
  voteOnReview,
  addReviewReply,
  updateReviewReply,
  deleteReviewReply,
  voteOnReply
} from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

// Public review route (no auth required)
router.route('/:id').get(getReview);

// Protected routes (authentication required)
router.use(protect);

router
  .route('/:id')
  .put(updateReview)
  .delete(deleteReview);

// Review voting
router.route('/:id/vote').post(voteOnReview);

// Review replies
router.route('/:id/replies').post(addReviewReply);

router
  .route('/:id/replies/:replyId')
  .put(updateReviewReply)
  .delete(deleteReviewReply);

// Reply voting
router.route('/:id/replies/:replyId/vote').post(voteOnReply);

export default router; 