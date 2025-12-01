import mongoose from 'mongoose';
import User from '../models/User.js';
import ENV from '../config/envLoader.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

// Run envLoader to load MongoDB connection string
const dbURI = ENV.MONGODB_URI || process.env.MONGODB_URI;
if (!dbURI) {
  console.error('MongoDB URI is missing. Check your .env file');
  process.exit(1);
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question method
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('===== Admin User Setup =====');
    
    // Get user input for email and password
    const adminEmail = await question('Enter admin email: ');
    const adminPassword = await question('Enter admin password (min 6 characters): ');
    
    // Validate inputs
    if (!adminEmail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
      console.error('Invalid email format');
      process.exit(1);
    }
    
    if (adminPassword.length < 6) {
      console.error('Password must be at least 6 characters long');
      process.exit(1);
    }
    
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('User with this email already exists');
      process.exit(0);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log(`Admin user created successfully with email: ${adminEmail}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

createAdmin(); 