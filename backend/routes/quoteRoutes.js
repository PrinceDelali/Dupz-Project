import express from 'express';
import { 
  submitQuote, 
  getQuotes, 
  getQuoteById, 
  updateQuoteStatus, 
  addQuoteNote, 
  deleteQuote 
} from '../controllers/quoteController.js';
import { protect, admin, hasPermission } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/quotes', submitQuote);

// Admin routes (protected)
router.get('/admin/quotes', protect, hasPermission('quotes'), getQuotes);
router.get('/admin/quotes/:id', protect, hasPermission('quotes'), getQuoteById);
router.patch('/admin/quotes/:id/status', protect, hasPermission('quotes'), updateQuoteStatus);
router.post('/admin/quotes/:id/notes', protect, hasPermission('quotes'), addQuoteNote);
router.delete('/admin/quotes/:id', protect, admin, deleteQuote); // Admin only

export default router; 