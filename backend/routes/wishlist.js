import express from 'express';
import { 
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All wishlist routes are protected
router.use(protect);

// Get wishlist and add item to wishlist
router.route('/')
  .get(getWishlist)
  .post(addToWishlist)
  .delete(clearWishlist);

// Remove specific item from wishlist
router.delete('/:id', removeFromWishlist);

export default router; 