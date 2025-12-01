import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getUsers, getUser, deleteUser, updateUser, createAdminUser } from '../controllers/userController.js';

const router = express.Router();

// Routes for /api/v1/users
router.route('/')
  .get(protect, authorize('admin'), getUsers);

// Route for creating admin/staff users
router.route('/admin')
  .post(protect, authorize('admin'), createAdminUser);

router.route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

export default router; 