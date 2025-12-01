import jwt from 'jsonwebtoken';
import asyncHandler from './async.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  console.log('[Auth Middleware] Checking authorization header:', req.headers.authorization?.substring(0, 20) + '...');

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    console.log('[Auth Middleware] Token extracted from header');
  } else if (req.cookies?.token) {
    token = req.cookies.token;
    console.log('[Auth Middleware] Token extracted from cookies');
  } else {
    console.log('[Auth Middleware] No token found');
  }

  // Make sure token exists
  if (!token) {
    console.log('[Auth Middleware] Token missing, access denied');
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    console.log('[Auth Middleware] Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth Middleware] Token verified successfully, user ID:', decoded.id);

    // Get user from the token
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('[Auth Middleware] User not found for token');
      return next(new ErrorResponse('User not found', 404));
    }

    // Set user in request
    req.user = user;
    console.log('[Auth Middleware] User loaded:', user.email, 'Role:', user.role);
    
    // For staff users, log permissions
    if (user.role === 'staff') {
      console.log('[Auth Middleware] Staff permissions:', user.permissions || 'none');
    }
    
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.message);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Check if user is admin
export const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Check if user has specific permission
export const hasPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permissionName)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permissionName} access required`
      });
    }

    next();
  };
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('[Auth Middleware] Checking role authorization. User role:', req.user.role, 'Required roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      console.log('[Auth Middleware] Role not authorized:', req.user.role);
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    console.log('[Auth Middleware] Role authorized:', req.user.role);
    next();
  };
}; 