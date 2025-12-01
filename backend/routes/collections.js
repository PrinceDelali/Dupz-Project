import express from 'express';
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection
} from '../controllers/collectionController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Routes for collections
router
  .route('/')
  .get(getCollections)
  .post(protect, authorize('admin'), createCollection);

router
  .route('/:id')
  .get(getCollection)
  .put(protect, authorize('admin'), updateCollection)
  .delete(protect, authorize('admin'), deleteCollection);

// Routes for managing products in collections
router
  .route('/:id/products')
  .post(protect, authorize('admin'), addProductToCollection);

router
  .route('/:id/products/:productId')
  .delete(protect, authorize('admin'), removeProductFromCollection);

export default router; 