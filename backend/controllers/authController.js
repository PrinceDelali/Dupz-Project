import User from '../models/User.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;

  // Create user directly without verification
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phoneNumber, // Save phone number if provided
    isVerified: true // Set to true by default
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
});

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Always return success for security (don't reveal if email exists)
    return res.status(200).json({ 
      success: true, 
      data: 'If your email is registered, you will receive password reset instructions.' 
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url - use the frontend URL from env or default to localhost
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const html = `
    <h1>Password Reset Request</h1>
    <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #000000; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <p>This link will expire in 10 minutes.</p>
  `;

  try {
    console.log('📧 Attempting to send password reset email');
    
    // Check for development mode with verified email override
    const emailRecipient = req.body.verifiedEmail || user.email;
    
    // If using override, log it
    if (req.body.verifiedEmail) {
      console.log(`⚠️ Development mode: Using verified email ${req.body.verifiedEmail} instead of user email ${user.email}`);
    }
    
    await sendEmail({
      email: emailRecipient, // Use the override or the real email
      subject: 'Sinosply - Password Reset Instructions',
      html
    });

    res.status(200).json({ 
      success: true, 
      data: 'If your email is registered, you will receive password reset instructions.' 
    });
  } catch (err) {
    console.error('❌ Error sending password reset email:', err);
    
    // Reset the token and expiry in case of failure
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent. Please try again later.', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyOTP = async (req, res) => {
  console.log('Received OTP verification request:', req.body);
  
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('Stored OTP:', user.otp, 'Received OTP:', otp);
    console.log('OTP Expiry:', user.otpExpiry, 'Current Time:', Date.now());

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ success: false, error: 'Verification code has expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    console.log('User verified successfully');

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      details: error.message
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendVerificationEmail(email, otp);

    res.status(200).json({ success: true, message: 'New verification code sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const requestSignupOTP = async (req, res) => {
  console.log('Received signup OTP request for email:', req.body.email);
  
  try {
    const { email } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already registered:', email);
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp, 'for email:', email);
    
    try {
      // Store OTP temporarily
      const tempUser = await User.findOneAndUpdate(
        { email },
        {
          email,
          otp,
          otpExpiry: Date.now() + 10 * 60 * 1000,
          isVerified: false
        },
        { upsert: true, new: true }
      );
      console.log('Temporary user created/updated:', tempUser._id);

      // Send verification email
      await sendVerificationEmail(email, otp);
      console.log('Verification email sent successfully to:', email);

      res.status(200).json({
        success: true,
        message: 'Verification code sent to email'
      });
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      throw error;
    }
  } catch (error) {
    console.error('Error in requestSignupOTP:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending verification code',
      details: error.message
    });
  }
};

export const adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  try {
    // Check for admin user
    const admin = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!admin) {
      return next(new ErrorResponse('Invalid admin credentials', 401));
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid admin credentials', 401));
    }

    sendTokenResponse(admin, 200, res);
  } catch (error) {
    console.error('Admin login error:', error);
    return next(new ErrorResponse('Error during login', 500));
  }
});

// @desc    Staff login
// @route   POST /api/v1/auth/staff/login
// @access  Public
export const staffLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  try {
    console.log('Staff login attempt for:', email);
    
    // Check for staff user
    const staff = await User.findOne({ 
      email, 
      role: 'staff'
    }).select('+password');
    
    if (!staff) {
      console.log('Staff user not found:', email);
      return next(new ErrorResponse('Invalid staff credentials', 401));
    }

    // Check if password matches
    const isMatch = await staff.matchPassword(password);

    if (!isMatch) {
      console.log('Invalid password for staff user:', email);
      return next(new ErrorResponse('Invalid staff credentials', 401));
    }

    console.log('Staff login successful for:', email);
    console.log('Staff permissions:', staff.permissions);

    // If permissions array is empty or not defined, add default dashboard permission
    if (!staff.permissions || !Array.isArray(staff.permissions) || staff.permissions.length === 0) {
      console.log('Setting default permissions for staff user');
      staff.permissions = ['dashboard'];
      await staff.save();
    }

    // Include permissions in the response
    const userData = {
      id: staff._id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      role: staff.role,
      permissions: staff.permissions || ['dashboard']
    };

    console.log('Sending staff user data:', userData);

    const token = staff.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return next(new ErrorResponse('Error during login', 500));
  }
});

// @desc    Verify token
// @route   GET /api/v1/auth/verify
// @access  Private
export const verifyToken = asyncHandler(async (req, res, next) => {
  try {
    // Get the token from the authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(200).json({ valid: false, message: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(200).json({ valid: false, message: 'User not found' });
    }
    
    // Token is valid and user exists
    return res.status(200).json({ 
      valid: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(200).json({ valid: false, message: 'Invalid token' });
  }
}); 