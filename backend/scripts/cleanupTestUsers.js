import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get MongoDB URI from environment or use fallback
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sinosply';

// Show a warning if using the fallback URI
if (!process.env.MONGO_URI) {
  console.warn('\x1b[33m%s\x1b[0m', `
    WARNING: MONGO_URI not found in environment variables.
    Using default connection: ${mongoURI}
    
    If this is not correct, please:
    1. Make sure .env file exists in the backend root directory
    2. Make sure it contains MONGO_URI=your_actual_mongodb_uri
    3. You can create a .env file if it doesn't exist
  `);
}

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to remove test users
async function cleanupTestUsers() {
  try {
    console.log('Starting test user cleanup...');
    
    // Count test users before deletion
    const countBefore = await User.countDocuments({
      email: { $regex: '@sinosply-test.com$' }
    });
    console.log(`Found ${countBefore} test users in the database`);
    
    // Delete test users
    const result = await User.deleteMany({
      email: { $regex: '@sinosply-test.com$' }
    });
    
    console.log(`Successfully deleted ${result.deletedCount} test users`);
  } catch (error) {
    console.error('Error removing test users:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Execute the function
cleanupTestUsers(); 