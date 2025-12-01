import mongoose from 'mongoose';
import ENV from './envLoader.js';

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('🔑 MongoDB URI available:', !!ENV.MONGODB_URI);
    
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Show available collections 
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    // Get orders collection stats if it exists
    if (collections.some(c => c.name === 'orders')) {
      const orderCount = await mongoose.connection.db.collection('orders').countDocuments();
      console.log(`📊 ction contains ${orderCount} documents`);
    } else {
      console.log('⚠️ Orders collection does not exist');
    }
    
    // Setup connection event listeners for monitoring
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB; 