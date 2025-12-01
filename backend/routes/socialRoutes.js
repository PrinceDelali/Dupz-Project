import express from 'express';
import {
  getSocialLinks,
  getSocialLink,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink
} from '../controllers/socialController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(getSocialLinks)
  .post(protect, createSocialLink);

router
  .route('/:id')
  .get(getSocialLink)
  .put(protect, updateSocialLink)
  .delete(protect, deleteSocialLink);

export default router; 