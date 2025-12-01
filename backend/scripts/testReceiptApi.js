/**
 * Test script to verify payment receipt API handling
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API URL - hardcode for testing
const API_URL = 'http://localhost:5000/api/v1';

// Test receipt debug endpoint directly
const testReceiptDebugEndpoint = async () => {
  try {
    console.log('🧪 Testing receipt debug endpoint...');
    
    const testReceipt = {
      paymentReceipt: {
        type: 'image',
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // Tiny test image
        link: '',
        uploadedAt: new Date()
      }
    };
    
    const response = await axios.post(`${API_URL}/orders/receipt-debug`, testReceipt);
    
    console.log('📊 Receipt debug response:', response.data);
    console.log('✅ Receipt debug test completed successfully');
    
    return response.data;
  } catch (error) {
    console.error('❌ Receipt debug test error:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Test creating an order with receipt
const testCreateOrderWithReceipt = async () => {
  try {
    console.log('🧪 Testing order creation with receipt...');
    
    // Create a test order with receipt data
    const testOrder = {
      orderNumber: `API-TEST-${Date.now()}`,
      items: [{
        productId: 'test-product-123',
        name: 'Test Product',
        price: 19.99,
        quantity: 2,
        image: 'https://example.com/image.jpg',
        sku: 'TEST123',
        color: 'Black',
        size: 'M'
      }],
      shippingAddress: {
        name: 'Test Customer',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zip: '12345',
        country: 'Test Country',
        phone: '555-1234'
      },
      billingAddress: {
        name: 'Test Customer',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zip: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'Test Payment',
      paymentDetails: {
        transactionId: `txn_test_${Date.now()}`,
        status: 'completed',
        cardDetails: {
          brand: 'Visa',
          last4: '4242'
        }
      },
      paymentReceipt: {
        type: 'image',
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // Tiny test image
        link: '',
        uploadedAt: new Date()
      },
      subtotal: 39.98,
      tax: 4.00,
      shipping: 5.99,
      discount: 0,
      totalAmount: 49.97,
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      shippingMethod: 'Standard Shipping'
    };
    
    // Detailed logging of the request
    console.log('📝 [DEBUG] Request payload structure:', {
      hasPaymentReceipt: !!testOrder.paymentReceipt,
      paymentReceiptFields: testOrder.paymentReceipt ? Object.keys(testOrder.paymentReceipt) : [],
      receiptType: testOrder.paymentReceipt?.type,
      imageDataLength: testOrder.paymentReceipt?.imageData?.length || 0,
      linkValue: testOrder.paymentReceipt?.link || 'none'
    });
    
    // Make API call
    console.log('📤 Sending order with receipt to API...');
    const response = await axios.post(`${API_URL}/orders`, testOrder);
    
    // Detailed logging of the response
    console.log('📥 [DEBUG] API Response structure:', {
      success: response.data?.success,
      hasData: !!response.data?.data,
      dataKeys: response.data?.data ? Object.keys(response.data.data) : [],
      hasPaymentReceipt: !!response.data?.data?.paymentReceipt,
      paymentReceiptFields: response.data?.data?.paymentReceipt ? Object.keys(response.data.data.paymentReceipt) : []
    });
    
    // Further investigate the receipt in the response
    if (response.data?.data?.paymentReceipt) {
      console.log('🧾 [DEBUG] Detailed receipt in response:', {
        type: response.data.data.paymentReceipt.type,
        typeClass: typeof response.data.data.paymentReceipt.type,
        imageDataClass: typeof response.data.data.paymentReceipt.imageData,
        imageDataPresent: !!response.data.data.paymentReceipt.imageData,
        imageDataLength: response.data.data.paymentReceipt.imageData?.length || 0,
        linkClass: typeof response.data.data.paymentReceipt.link,
        linkPresent: !!response.data.data.paymentReceipt.link,
        linkValue: response.data.data.paymentReceipt.link || 'none',
        rawPaymentReceipt: JSON.stringify(response.data.data.paymentReceipt).substr(0, 100) + '...'
      });
    }
    
    console.log('🟢 Order created successfully!');
    console.log('📊 Receipt in response:', {
      type: response.data.data.paymentReceipt?.type || 'none',
      hasImageData: !!response.data.data.paymentReceipt?.imageData,
      hasLink: !!response.data.data.paymentReceipt?.link
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Order creation test error:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    // Test receipt debug endpoint
    await testReceiptDebugEndpoint();
    
    // Test order creation with receipt
    await testCreateOrderWithReceipt();
    
    console.log('✅ All tests completed successfully');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
  }
};

// Run the tests
main(); 