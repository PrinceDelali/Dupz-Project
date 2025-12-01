import express from 'express';
import { submitContactForm } from '../controllers/contactController.js';

const router = express.Router();

// Logging middleware
router.use((req, res, next) => {
  console.log(`Contact Route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Contact route
router.post('/contact', submitContactForm);

export default router; 