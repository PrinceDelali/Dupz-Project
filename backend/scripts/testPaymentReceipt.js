/**
 * Test script to verify payment receipt handling in backend
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Test function to create an order with a payment receipt
const testReceiptCreation = async () => {
  try {
    console.log('🧪 Starting payment receipt test...');
    
    // Create test order with receipt data
    const testOrder = new Order({
      orderNumber: `TEST-RECEIPT-${Date.now()}`,
      items: [{
        productId: 'test-product-123',
        name: 'Test Product',
        price: 29.99,
        quantity: 1
      }],
      shippingAddress: {
        name: 'Test User',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zip: '12345',
        country: 'Test Country',
        phone: '555-1234'
      },
      paymentMethod: 'Test Payment',
      subtotal: 29.99,
      totalAmount: 29.99,
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      // Test payment receipt data
      paymentReceipt: {
        type: 'test',
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // Tiny test image
        link: 'https://example.com/receipt',
        uploadedAt: new Date()
      }
    });
    
    // Save the test order
    const savedOrder = await testOrder.save();
    
    // Retrieve the saved order to check if receipt data was saved
    const retrievedOrder = await Order.findById(savedOrder._id);
    
    console.log('🟢 Test order created with ID:', retrievedOrder._id);
    console.log('📝 Payment receipt data in database:', {
      type: retrievedOrder.paymentReceipt?.type || 'none',
      hasImageData: !!retrievedOrder.paymentReceipt?.imageData,
      imageDataLength: retrievedOrder.paymentReceipt?.imageData?.length || 0,
      hasLink: !!retrievedOrder.paymentReceipt?.link
    });
    
    // Check if receipt data was saved correctly
    if (retrievedOrder.paymentReceipt && 
        retrievedOrder.paymentReceipt.type === 'test' &&
        retrievedOrder.paymentReceipt.imageData &&
        retrievedOrder.paymentReceipt.link) {
      console.log('✅ Payment receipt test PASSED! Receipt data saved correctly.');
    } else {
      console.log('❌ Payment receipt test FAILED! Receipt data not saved correctly.');
      console.log('Expected type "test", got:', retrievedOrder.paymentReceipt?.type);
      console.log('Expected imageData to exist:', !!retrievedOrder.paymentReceipt?.imageData);
      console.log('Expected link to be "https://example.com/receipt", got:', retrievedOrder.paymentReceipt?.link);
    }
    
    return retrievedOrder;
  } catch (error) {
    console.error('❌ Error in receipt test:', error);
    throw error;
  }
};

// Update an existing order with payment receipt data
const testOrderReceiptUpdate = async (orderId) => {
  try {
    console.log(`🔄 Testing update of order ${orderId} with receipt data...`);
    
    // Find the order to update
    const order = await Order.findById(orderId);
    if (!order) {
      console.error(`❌ Order with ID ${orderId} not found`);
      return;
    }
    
    // Update with receipt data
    order.paymentReceipt = {
      type: 'link',
      imageData: '',
      link: 'https://updated-link.com/receipt',
      uploadedAt: new Date()
    };
    
    // Save the updated order
    await order.save();
    
    // Retrieve the updated order
    const updatedOrder = await Order.findById(orderId);
    
    console.log('📝 Updated payment receipt in database:', {
      type: updatedOrder.paymentReceipt?.type || 'none',
      hasImageData: !!updatedOrder.paymentReceipt?.imageData,
      hasLink: !!updatedOrder.paymentReceipt?.link
    });
    
    // Check if receipt data was updated correctly
    if (updatedOrder.paymentReceipt && 
        updatedOrder.paymentReceipt.type === 'link' &&
        updatedOrder.paymentReceipt.link === 'https://updated-link.com/receipt') {
      console.log('✅ Payment receipt update test PASSED! Receipt data updated correctly.');
    } else {
      console.log('❌ Payment receipt update test FAILED! Receipt data not updated correctly.');
    }
    
    return updatedOrder;
  } catch (error) {
    console.error('❌ Error in receipt update test:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  // Connect to database
  await connectDB();
  
  try {
    // Test order creation with receipt
    const testOrder = await testReceiptCreation();
    
    // Test updating an existing order with receipt
    if (process.argv.includes('--update-existing')) {
      const orderId = process.argv[process.argv.indexOf('--update-existing') + 1];
      if (orderId) {
        await testOrderReceiptUpdate(orderId);
      } else {
        console.error('❌ No order ID provided for updating');
      }
    } else if (testOrder) {
      // Update the order we just created
      await testOrderReceiptUpdate(testOrder._id);
    }
    
    // List some recent orders to check their receipt data
    console.log('\n📋 Checking recent orders for receipt data...');
    const recentOrders = await Order.find()
      .select('orderNumber paymentReceipt createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentOrders.forEach(order => {
      console.log(`- Order ${order.orderNumber} (${order._id}):`);
      console.log('  Receipt type:', order.paymentReceipt?.type || 'none');
      console.log('  Has image data:', !!order.paymentReceipt?.imageData);
      console.log('  Has link:', !!order.paymentReceipt?.link);
      console.log('  Created at:', new Date(order.createdAt).toLocaleString());
    });
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Disconnect from database
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the tests
main(); 