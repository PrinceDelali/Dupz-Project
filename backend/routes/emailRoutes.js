import express from 'express';
import { orderConfirmationEmail, orderStatusUpdateEmail, welcomeEmail } from '../controllers/emailController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Order confirmation email
router.post('/order-confirmation', orderConfirmationEmail);

// Order status update email - protected with authentication
router.post('/order-status-update', protect, orderStatusUpdateEmail);

// Welcome email for new users
router.post('/welcome', welcomeEmail);

export default router; 