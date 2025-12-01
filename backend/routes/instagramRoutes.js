import express from 'express';
import {
  getInstagramImages,
  getInstagramImage,
  createInstagramImage,
  updateInstagramImage,
  deleteInstagramImage
} from '../controllers/instagramController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(getInstagramImages)
  .post(protect, createInstagramImage);

router
  .route('/:id')
  .get(getInstagramImage)
  .put(protect, updateInstagramImage)
  .delete(protect, deleteInstagramImage);

export default router; 