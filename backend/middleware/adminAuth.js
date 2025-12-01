/**
 * Admin Authentication Middleware
 * Checks if the authenticated user has admin role
 */

import ErrorResponse from '../utils/errorResponse.js';

const adminAuth = (req, res, next) => {
  // Check if there's a user object from previous auth middleware
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  // User is an admin, proceed
  next();
};

export default adminAuth; 