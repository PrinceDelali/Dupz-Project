import express from 'express';
import passport from '../config/passportSetup.js';
import { register, login, forgotPassword, resetPassword, verifyOTP, resendOTP, requestSignupOTP, adminLogin, staffLogin, verifyToken } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Logging middleware
router.use((req, res, next) => {
  console.log(`Auth Route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

console.log('Setting up auth routes with strategies:', Object.keys(passport._strategies));

// Debug route
router.get('/oauth-debug', (req, res) => {
  const envCheck = {
    googleConfigured: !!passport._strategies.google,
    envVariables: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 8)}...` : 'not set',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Present but hidden' : 'not set',
      FRONTEND_URL: process.env.FRONTEND_URL
    },
    availableStrategies: Object.keys(passport._strategies)
  };
  
  res.json(envCheck);
});

// Test connection endpoint for debugging
router.get('/test-connection', (req, res) => {
  console.log('Test connection request received');
  res.status(200).json({
    success: true,
    message: 'API connection successful',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test login endpoint (for debugging only)
router.post('/test-login', (req, res) => {
  console.log('Test login request received with body:', {
    email: req.body.email,
    hasPassword: !!req.body.password
  });
  
  // Simple validation
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password'
    });
  }
  
  // Hardcoded test user
  const testUser = {
    _id: '123456789',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'user'
  };
  
  // Check if the email matches our test user
  if (req.body.email === testUser.email && req.body.password === 'password123') {
    // Return a mock token
    return res.status(200).json({
      success: true,
      token: 'test-jwt-token-' + Date.now(),
      user: testUser
    });
  }
  
  // Unauthorized
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
});

// Verify token endpoint
router.get('/verify', verifyToken);

// Standard auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Google OAuth routes - Always set up these routes now
console.log('Setting up Google OAuth routes directly...');
  
router.get('/google',
  (req, res, next) => {
    console.log('Google auth initiated');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false 
    })(req, res, next);
  }
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=Google authentication failed` 
  }),
  (req, res) => {
    console.log('Google auth successful for:', req.user.email);
    const token = req.user.getSignedJwtToken();
    res.send(`
      <script>
        window.opener.postMessage(
          {
            token: '${token}',
            user: {
              id: '${req.user._id}',
              firstName: '${req.user.firstName}',
              lastName: '${req.user.lastName}',
              email: '${req.user.email}',
              role: '${req.user.role}'
            }
          },
          '${process.env.FRONTEND_URL}'
        );
        window.close();
      </script>
    `);
  }
);

// Add similar routes for other providers...

router.post('/admin/login', adminLogin);
router.post('/staff/login', staffLogin);

// Debug - add a route to verify authentication
router.get('/check-auth', protect, (req, res) => {
  console.log('[DEBUG] Authentication check for user:', req.user.email);
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      permissions: req.user.permissions
    },
    message: 'User is authenticated'
  });
});

export default router; 