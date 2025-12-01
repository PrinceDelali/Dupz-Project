import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In development, load from .env file directly
// In production (Render), env vars are set in the platform
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.join(__dirname, '.env');
  console.log(`Checking for .env file at: ${envPath}`);
  
  try {
    if (fs.existsSync(envPath)) {
      console.log('Found .env file, loading environment variables');
      // Actual loading will be done by the envLoader module
    } else {
      console.log('No .env file found, will use environment variables from platform');
    }
  } catch (err) {
    console.error('Error checking for .env file:', err.message);
  }
} else {
  console.log('Running in production mode, using environment variables from platform');
}

// Import our centralized environment loader
import ENV from './config/envLoader.js';

// Now import other dependencies
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import updateLastActive from './middleware/updateLastActive.js';
import socialCrawlerDetection from './middleware/socialCrawlerDetection.js';
import { startUptimeService } from './utils/uptimeService.js';

// Import the passport setup that will use our environment variables
import passport from './config/passportSetup.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import lightOrderRoutes from './routes/lightOrders.js';
import productsRoutes from './routes/products.js';
import userRoutes from './routes/userRoutes.js';
import collectionsRoutes from './routes/collections.js';
import platformRoutes from './routes/platformRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import instagramRoutes from './routes/instagramRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import uptimeRoutes from './routes/uptimeRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import User from './models/User.js';
import setupSocket from './socket.js';

const app = express();
const PORT = ENV.PORT || process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Set up our custom socket.io handler for real-time order notifications
const { io, notifyNewOrder, notifyOrderUpdate } = setupSocket(app, httpServer);

// Export notification functions for use in other parts of the application
export { notifyNewOrder, notifyOrderUpdate };

// Active chat sessions storage
const activeSessions = new Map();
const adminConnections = new Set();
const customerSessions = new Map(); // Maps sessionId to socket ID

// Socket.io middleware for logging
io.use((socket, next) => {
  const sessionId = socket.handshake.query.sessionId;
  const userType = socket.handshake.query.userType;
  console.log(`[SOCKET] New connection attempt: ${userType} - ${sessionId}`);
  next();
});

// Socket.io connection handler
io.on('connection', (socket) => {
  const sessionId = socket.handshake.query.sessionId;
  const userType = socket.handshake.query.userType;
  const userId = socket.handshake.query.userId;
  
  console.log(`[SOCKET] Client connected: ${userType} - ${sessionId}`);
  
  // Track session based on type
  if (userType === 'admin') {
    adminConnections.add(socket.id);
    console.log(`[SOCKET] Admin connected: ${socket.id}, Total admins: ${adminConnections.size}`);
    
    // Send active sessions list to admin
    const sessionsList = Array.from(activeSessions.values());
    socket.emit('sessions_update', sessionsList);
  } else if (userType === 'customer') {
    // Store the customer's socket ID with their session
    customerSessions.set(sessionId, socket.id);
    
    // Initialize or update the session
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, {
        sessionId,
        customerInfo: {
          name: socket.handshake.query.userName || 'Guest Customer',
          email: socket.handshake.query.userEmail || 'guest@example.com',
          userId: socket.handshake.query.userId || null,
          isAuthenticated: !!socket.handshake.query.userId
        },
        messages: [],
        lastActive: new Date(),
        unreadCount: 0
      });
    }
    
    // Notify admins of customer connection
    io.to(Array.from(adminConnections)).emit('customer_connected', {
      sessionId,
      timestamp: new Date()
    });
  }
  
  // Socket.io event handlers
  
  // Initialization event
  socket.on('init', async (data) => {
    try {
      console.log(`[SOCKET] Init received from ${data.userType}:`, data.sessionId);
      
      if (data.userType === 'customer') {
        let customerInfo = {
          name: 'Guest Customer',
          email: 'guest@example.com',
          isAuthenticated: false
        };
        
        // If user data was provided and includes authentication info
        if (data.userData && data.userData.isAuthenticated) {
          customerInfo = {
            name: data.userData.name,
            email: data.userData.email,
            userId: data.userData.id,
            isAuthenticated: true
          };
          
          // Verify user against database (optional extra security)
          try {
            const user = await User.findById(data.userData.id).select('-password');
            if (user) {
              // Update with verified information from database
              customerInfo.name = `${user.firstName} ${user.lastName}`;
              customerInfo.email = user.email;
              console.log(`[SOCKET] Verified authenticated user: ${user._id}`);
            }
          } catch (err) {
            console.error(`[SOCKET] Error verifying user: ${err.message}`);
            // Continue with provided info even if verification fails
          }
        }
        
        // Update session with customer info
        if (activeSessions.has(data.sessionId)) {
          const session = activeSessions.get(data.sessionId);
          session.customerInfo = customerInfo;
          session.lastActive = new Date();
          activeSessions.set(data.sessionId, session);
        } else {
          activeSessions.set(data.sessionId, {
            sessionId: data.sessionId,
            customerInfo,
            messages: [],
            lastActive: new Date(),
            unreadCount: 0
          });
        }
        
        // Notify admins of the new/updated session
        io.to(Array.from(adminConnections)).emit('sessions_update', [
          activeSessions.get(data.sessionId)
        ]);
      }
    } catch (error) {
      console.error(`[SOCKET] Error in init handler: ${error.message}`);
    }
  });

  // Message event
  socket.on('message', (data) => {
    try {
      const { messageId, sessionId, content, sender, timestamp, fileType, fileUrl, fileName, fileSize } = data;
      console.log(`[SOCKET] Message from ${sender}:`, content);
      
      // Store the message in the session
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        
        session.messages.push({
          messageId,
          content,
          sender,
          timestamp,
          fileType,
          fileUrl,
          fileName,
          fileSize
        });
        
        session.lastActive = new Date();
        
        // Update unread count for admin-targeted messages
        if (sender === 'customer') {
          session.unreadCount = (session.unreadCount || 0) + 1;
        }
        
        activeSessions.set(sessionId, session);
      }
      
      // Forward message to the recipient
      if (sender === 'customer') {
        // Send to all admins
        io.to(Array.from(adminConnections)).emit('message', data);
      } else if (sender === 'admin') {
        // Send to the specific customer
        const customerSocketId = customerSessions.get(sessionId);
        if (customerSocketId) {
          io.to(customerSocketId).emit('message', data);
        }
      }
    } catch (error) {
      console.error(`[SOCKET] Error in message handler: ${error.message}`);
    }
  });

  // Typing indicator event
  socket.on('typing', (data) => {
    try {
      const { sessionId, isTyping, userType } = data;
      
      if (userType === 'customer') {
        // Forward typing indicator to admins
        io.to(Array.from(adminConnections)).emit('typing', data);
      } else if (userType === 'admin') {
        // Forward to specific customer
        const customerSocketId = customerSessions.get(sessionId);
        if (customerSocketId) {
          io.to(customerSocketId).emit('typing', data);
        }
      }
    } catch (error) {
      console.error(`[SOCKET] Error in typing handler: ${error.message}`);
    }
  });

  // Get all sessions (admin only)
  socket.on('get_sessions', () => {
    if (adminConnections.has(socket.id)) {
      console.log(`[SOCKET] Admin requested all sessions`);
      const sessionsList = Array.from(activeSessions.values());
      socket.emit('sessions_update', sessionsList);
    }
  });

  // Select session (admin only)
  socket.on('select_session', (data) => {
    if (adminConnections.has(socket.id)) {
      const { sessionId } = data;
      console.log(`[SOCKET] Admin selected session: ${sessionId}`);
      
      // Send message history for this session
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        socket.emit('history', { 
          sessionId, 
          messages: session.messages 
        });
      }
    }
  });

  // Mark as read (admin only)
  socket.on('mark_as_read', (data) => {
    if (adminConnections.has(socket.id)) {
      const { sessionId } = data;
      console.log(`[SOCKET] Admin marked session as read: ${sessionId}`);
      
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        session.unreadCount = 0;
        activeSessions.set(sessionId, session);
      }
    }
  });

  // Get message history
  socket.on('get_history', (data) => {
    const { sessionId } = data;
    console.log(`[SOCKET] History requested for session: ${sessionId}`);
    
    if (activeSessions.has(sessionId)) {
      const session = activeSessions.get(sessionId);
      socket.emit('history', { 
        sessionId, 
        messages: session.messages 
      });
    } else {
      socket.emit('history', { 
        sessionId, 
        messages: [] 
      });
    }
  });

  // Upload file
  socket.on('upload_file', (data) => {
    try {
      const { messageId, sessionId, fileName, fileType, fileSize, fileData } = data;
      console.log(`[SOCKET] File upload from session ${sessionId}: ${fileName} (${fileSize} bytes)`);
      
      // Process upload (simulate progress)
      socket.emit('upload_progress', { messageId, progress: 25 });
      
      setTimeout(() => {
        socket.emit('upload_progress', { messageId, progress: 50 });
        
        // Create file URL (this would usually involve actual file saving)
        // For now, we'll just convert base64 directly to a data URL
        // In production, you'd want to save this to disk or cloud storage
        let fileUrl;
        if (fileType === 'image') {
          fileUrl = `data:image/${fileName.split('.').pop()};base64,${fileData}`;
        } else {
          fileUrl = `data:application/octet-stream;base64,${fileData}`;
        }
        
        setTimeout(() => {
          socket.emit('upload_progress', { messageId, progress: 75 });
          
          setTimeout(() => {
            // Complete the upload
            socket.emit('upload_progress', { messageId, progress: 100 });
            socket.emit('upload_complete', { 
              messageId, 
              fileUrl, 
              fileName,
              fileSize
            });
            
            // Store message in session
            if (activeSessions.has(sessionId)) {
              const session = activeSessions.get(sessionId);
              
              const message = {
                messageId,
                content: fileType === 'image' ? 'Sent an image' : `Sent a file: ${fileName}`,
                sender: 'customer',
                timestamp: new Date().toISOString(),
                fileType,
                fileUrl,
                fileName,
                fileSize
              };
              
              session.messages.push(message);
              session.lastActive = new Date();
              session.unreadCount = (session.unreadCount || 0) + 1;
              
              activeSessions.set(sessionId, session);
              
              // Notify admins
              io.to(Array.from(adminConnections)).emit('message', message);
            }
          }, 500);
        }, 500);
      }, 500);
    } catch (error) {
      console.error(`[SOCKET] Error in file upload handler: ${error.message}`);
      socket.emit('upload_error', { 
        error: 'Failed to process file upload', 
        messageId: data.messageId 
      });
    }
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    
    // Handle admin disconnect
    if (adminConnections.has(socket.id)) {
      adminConnections.delete(socket.id);
      console.log(`[SOCKET] Admin disconnected, remaining: ${adminConnections.size}`);
    }
    
    // Handle customer disconnect
    for (const [sessionId, socketId] of customerSessions.entries()) {
      if (socketId === socket.id) {
        console.log(`[SOCKET] Customer disconnected: ${sessionId}`);
        customerSessions.delete(sessionId);
        
        // Notify admins
        io.to(Array.from(adminConnections)).emit('customer_disconnected', {
          sessionId,
          timestamp: new Date()
        });
        
        break;
      }
    }
  });
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'https://bunnyandwolf.vercel.app',
    'https://www.sinosply.com',
    'https://sinosply.com',
    ENV.FRONTEND_URL, 
    'http://localhost:5000',
    'http://localhost:5173',
    'https://sinosply-backend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin']
}));

// Add CORS pre-flight handling for all routes
app.options('*', cors());

// Add direct CORS headers for debugging
app.use((req, res, next) => {
  // Get the origin from the request
  const origin = req.headers.origin;
  
  // Define allowed origins
  const allowedOrigins = [
    'https://bunnyandwolf.vercel.app',
    'https://www.sinosply.com',
    'https://sinosply.com',
    ENV.FRONTEND_URL, 
    'http://localhost:5000',
    'http://localhost:5173',
    'https://sinosply-backend.onrender.com'
  ];
  
  // Check if the request origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    // Set CORS headers dynamically based on the requesting origin
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight OPTIONS requests specifically
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(morgan('dev'));
// Increase JSON body parser limit to 10MB for handling image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add social crawler detection middleware
app.use(socialCrawlerDetection);

// Serve static files from uploads directory
// This maps /api/v1/uploads to the ./uploads directory
app.use('/api/v1/uploads', (req, res, next) => {
  // Log all requests to the uploads directory
  console.log(`[FILE REQUEST] ${req.method} ${req.url}`);
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Also serve files directly from the quotes subdirectory 
// This provides an alternative path that can be used as a fallback
app.use('/api/v1/uploads/quotes', (req, res, next) => {
  console.log(`[QUOTES FILE REQUEST] ${req.method} ${req.url}`);
  next();
}, express.static(path.join(__dirname, 'uploads', 'quotes')));

// Log the upload directory paths for debugging
console.log('Static file directories:');
console.log(`- Base dir: ${__dirname}`);
console.log(`- Uploads: ${path.join(__dirname, 'uploads')}`);
console.log(`- Quotes: ${path.join(__dirname, 'uploads/quotes')}`);

// Check if uploads directory exists, if not create it
const uploadsDir = path.join(__dirname, 'uploads');
const quotesDir = path.join(__dirname, 'uploads/quotes');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory');
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(quotesDir)) {
  console.log('Creating uploads/quotes directory');
  fs.mkdirSync(quotesDir, { recursive: true });
}

// Initialize passport
app.use(passport.initialize());
console.log('Available passport strategies:', Object.keys(passport._strategies));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/light-orders', lightOrderRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/collections', collectionsRoutes);
app.use('/api/v1/platforms', platformRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/instagram', instagramRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1', contactRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/uptime', uptimeRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);

// Import and use SEO routes
import seoRoutes from './routes/seo.routes.js';
app.use('/api/v1/seo', seoRoutes);

// Import and use Sitemap routes 
import sitemapRoutes from './routes/sitemap.routes.js';
app.use('/api/v1', sitemapRoutes);

// Debug: Log all the routes in quoteRoutes
console.log('Quote Routes:');
quoteRoutes.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods).join(',')} /api/v1${r.route.path}`);
  }
});

app.use('/api/v1', quoteRoutes);

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Sinosply API is running',
    environment: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

// Log registered routes in development
if (ENV.NODE_ENV !== 'production') {
  console.log('📝 API Routes registered:');
  console.log('- /api/v1/auth');
  console.log('- /api/v1/light-orders');
  console.log('- /api/v1/orders');
  console.log('- /api/v1/admin');
  console.log('- /api/v1/wishlist');
  console.log('- /api/v1/products');
  console.log('- /api/v1/reviews');
  console.log('- /api/v1/users');
  console.log('- /api/v1/collections');
  console.log('- /api/v1/platforms');
  console.log('- /api/v1/settings');
  console.log('- /api/v1/coupons');
  console.log('- /api/v1/quotes');
  
  // Log admin routes specifically
  console.log('\n📝 Admin routes registered:');
  adminRoutes.stack.forEach((route) => {
    if (route.route) {
      const path = route.route.path;
      const methods = Object.keys(route.route.methods).join(', ').toUpperCase();
      console.log(`- ${methods} /api/v1/admin${path}`);
    }
  });
}

// Middleware for active status
app.use('/api/v1/*', updateLastActive);

// Error handling
app.use(errorHandler);

// Add a simple test route
app.get('/api/env-test', (req, res) => {
  res.json({
    mongoDBPresent: !!ENV.MONGODB_URI,
    googleClientIdPresent: !!ENV.GOOGLE_CLIENT_ID,
    googleClientSecretPresent: !!ENV.GOOGLE_CLIENT_SECRET,
    frontendUrl: ENV.FRONTEND_URL
  });
});

// Debug route to list all available API endpoints
app.get('/api/v1/debug', (req, res) => {
  console.log('API Debug route accessed');
  res.status(200).json({
    success: true,
    message: 'API debug information',
    apiVersion: 'v1',
    endpoints: {
      auth: '/api/v1/auth/*',
      admin: '/api/v1/admin/*',
      orders: '/api/v1/orders/*',
      lightOrders: '/api/v1/light-orders/*',
      wishlist: '/api/v1/wishlist/*',
      users: '/api/v1/users/*',
      collections: '/api/v1/collections/*',
      settings: '/api/v1/settings/*',
      quotes: '/api/v1/quotes/*',
      debug: {
        orders: '/api/v1/orders/debug',
        lightOrders: '/api/v1/light-orders/health',
        env: '/api/env-test'
      }
    },
    serverTime: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start the uptime service to keep the server alive
  startUptimeService();
  console.log('Uptime service started - pinging every 5 minutes');
});

export default app; 