import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

// Load environment variables
dotenv.config({ path: envPath });

// Connection timeout (ms)
const TIMEOUT = 5000;

// Diagnostic test script for MongoDB connection
const testMongoConnection = async () => {
  console.log('MongoDB Connection Test Script');
  console.log('-----------------------------');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check MongoDB URI
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }
  
  // Mask the URI for security
  const maskedUri = uri.replace(
    /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
    'mongodb$1://$2:****@'
  );
  
  console.log(`Connecting to MongoDB: ${maskedUri}`);
  
  try {
    // Set connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: TIMEOUT,
      serverSelectionTimeoutMS: TIMEOUT
    };
    
    console.log(`Connection timeout set to ${TIMEOUT}ms`);
    
    // Start connection timer
    const startTime = Date.now();
    console.log(`Connection attempt started at: ${new Date(startTime).toISOString()}`);
    
    // Attempt connection
    const connection = await mongoose.connect(uri, options);
    
    const endTime = Date.now();
    const connectionTime = endTime - startTime;
    
    console.log(`\n✅ Successfully connected to MongoDB in ${connectionTime}ms`);
    console.log(`MongoDB version: ${connection.connection.version}`);
    console.log(`Connection host: ${connection.connection.host}`);
    
    // Get list of collections
    console.log(`\nFetching collections...`);
    const collections = await connection.connection.db.listCollections().toArray();
    
    console.log(`\nAvailable collections (${collections.length}):`);
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // Test query performance
    if (collections.find(c => c.name === 'orders')) {
      console.log('\nTesting query performance on Orders collection...');
      
      // Count documents
      const startCount = Date.now();
      const count = await connection.connection.db.collection('orders').countDocuments();
      const countTime = Date.now() - startCount;
      console.log(`Found ${count} orders in ${countTime}ms`);
      
      // Simple find query
      const startFind = Date.now();
      const sampleOrders = await connection.connection.db
        .collection('orders')
        .find({})
        .limit(5)
        .toArray();
      const findTime = Date.now() - startFind;
      
      console.log(`Retrieved ${sampleOrders.length} sample orders in ${findTime}ms`);
    }
    
    // Close connection
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed');
    
  } catch (error) {
    console.error('\n❌ MongoDB Connection Error:');
    console.error(error);
    
    // Check for specific error types
    if (error.name === 'MongoTimeoutError') {
      console.error('\nTimed out while trying to connect. Check:');
      console.error('1. Network connectivity');
      console.error('2. MongoDB server is running');
      console.error('3. Database credentials are correct');
      console.error('4. Firewall settings are not blocking the connection');
    } else if (error.name === 'MongoParseError') {
      console.error('\nInvalid MongoDB connection string. Check:');
      console.error('1. Connection string format is correct');
      console.error('2. The URL is properly encoded');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\nHost not found. Check:');
      console.error('1. The hostname is correct');
      console.error('2. DNS resolution is working');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\nConnection refused. Check:');
      console.error('1. MongoDB server is running on the specified host:port');
      console.error('2. Firewall is not blocking the connection');
      console.error('3. Network Access settings in MongoDB Atlas');
    } else if (error.message.includes('Authentication failed')) {
      console.error('\nAuthentication failed. Check:');
      console.error('1. Username is correct');
      console.error('2. Password is correct');
      console.error('3. User has appropriate permissions');
    }
  }
};

// Run the test
testMongoConnection(); 