import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
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

const roles = ['user', 'staff', 'admin'];
const roleWeights = [0.85, 0.10, 0.05]; // 85% users, 10% staff, 5% admins

const possiblePermissions = [
  'dashboard', 'products', 'orders', 'customers', 
  'reports', 'settings', 'marketing', 'inventory'
];

// Function to select a role based on weights
function selectRole() {
  const rand = Math.random();
  let sum = 0;
  
  for (let i = 0; i < roles.length; i++) {
    sum += roleWeights[i];
    if (rand < sum) return roles[i];
  }
  
  return 'user'; // Default fallback
}

// Function to generate permissions based on role
function generatePermissions(role) {
  if (role === 'admin') return possiblePermissions;
  if (role === 'user') return [];
  
  // For staff, randomly select 2-5 permissions
  const permCount = Math.floor(Math.random() * 4) + 2;
  const shuffled = [...possiblePermissions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, permCount);
}

// Function to generate a single user
function generateUser(index) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const role = selectRole();
  
  return {
    firstName,
    lastName,
    email: `test.user.${index}@sinosply-test.com`,
    password: 'password123', // This will be hashed by the User model pre-save hook
    role,
    permissions: generatePermissions(role),
    isVerified: Math.random() > 0.2, // 80% are verified
    lastActive: faker.date.past()
  };
}

// Generate and insert 500 users
async function generateUsers(count = 10000) {
  console.log(`Starting to generate ${count} users...`);
  
  try {
    const users = [];
    
    for (let i = 1; i <= count; i++) {
      users.push(generateUser(i));
      
      // Log progress every 50 users
      if (i % 50 === 0) {
        console.log(`Generated ${i} users...`);
      }
    }
    
    // Insert users in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await User.insertMany(batch);
      console.log(`Inserted batch ${i/batchSize + 1} of ${Math.ceil(users.length/batchSize)}`);
    }
    
    console.log(`Successfully generated and inserted ${count} test users!`);
    console.log('All test users have email pattern: test.user.X@sinosply-test.com');
    console.log('All test users have password: password123');
  } catch (error) {
    console.error('Error generating users:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Execute the function
generateUsers(); 