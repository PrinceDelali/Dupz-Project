// Generate random dummy orders for testing
export const generateDummyOrders = (count = 50) => {
  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
  const paymentMethods = ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery'];
  const shippingMethods = ['Standard Shipping', 'Express Shipping', 'Next Day Delivery', 'Free Shipping'];
  
  const products = [
    { id: 'P001', name: 'Premium Headphones', price: 129.99, sku: 'AUDIO001', image: 'https://source.unsplash.com/100x100?headphones' },
    { id: 'P002', name: 'Wireless Mouse', price: 49.99, sku: 'COMP002', image: 'https://source.unsplash.com/100x100?mouse' },
    { id: 'P003', name: 'Smart Watch', price: 199.99, sku: 'WEAR003', image: 'https://source.unsplash.com/100x100?smartwatch' },
    { id: 'P004', name: 'Bluetooth Speaker', price: 79.99, sku: 'AUDIO004', image: 'https://source.unsplash.com/100x100?speaker' },
    { id: 'P005', name: 'Mechanical Keyboard', price: 149.99, sku: 'COMP005', image: 'https://source.unsplash.com/100x100?keyboard' },
    { id: 'P006', name: 'Laptop Stand', price: 39.99, sku: 'DESK006', image: 'https://source.unsplash.com/100x100?laptopstand' },
    { id: 'P007', name: 'External SSD', price: 89.99, sku: 'STOR007', image: 'https://source.unsplash.com/100x100?ssd' },
    { id: 'P008', name: 'Noise-Canceling Earbuds', price: 159.99, sku: 'AUDIO008', image: 'https://source.unsplash.com/100x100?earbuds' },
    { id: 'P009', name: 'Webcam HD Pro', price: 69.99, sku: 'VIDEO009', image: 'https://source.unsplash.com/100x100?webcam' },
    { id: 'P010', name: 'USB-C Hub', price: 59.99, sku: 'CONN010', image: 'https://source.unsplash.com/100x100?usbhub' },
  ];
  
  const customers = [
    { id: '101', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', phone: '(555) 123-4567', address: '123 Main St, New York, NY 10001' },
    { id: '102', name: 'Michael Chen', email: 'michael.chen@example.com', phone: '(555) 234-5678', address: '456 Oak Ave, San Francisco, CA 94102' },
    { id: '103', name: 'Emma Rodriguez', email: 'emma.rodriguez@example.com', phone: '(555) 345-6789', address: '789 Pine Rd, Chicago, IL 60601' },
    { id: '104', name: 'James Wilson', email: 'james.wilson@example.com', phone: '(555) 456-7890', address: '101 Maple Dr, Austin, TX 78701' },
    { id: '105', name: 'Olivia Kim', email: 'olivia.kim@example.com', phone: '(555) 567-8901', address: '202 Cedar Ln, Seattle, WA 98101' },
    { id: '106', name: 'William Brown', email: 'william.brown@example.com', phone: '(555) 678-9012', address: '303 Birch Blvd, Boston, MA 02108' },
    { id: '107', name: 'Sophia Martinez', email: 'sophia.martinez@example.com', phone: '(555) 789-0123', address: '404 Elm St, Miami, FL 33101' },
    { id: '108', name: 'Benjamin Davis', email: 'benjamin.davis@example.com', phone: '(555) 890-1234', address: '505 Walnut Ave, Denver, CO 80201' },
    { id: '109', name: 'Isabella Taylor', email: 'isabella.taylor@example.com', phone: '(555) 901-2345', address: '606 Cherry Dr, Portland, OR 97201' },
    { id: '110', name: 'Lucas Garcia', email: 'lucas.garcia@example.com', phone: '(555) 012-3456', address: '707 Spruce Rd, Nashville, TN 37201' },
  ];

  // Generate a random date within the last 90 days
  const randomDate = () => {
    const now = new Date();
    const past = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    return past;
  };

  // Generate random order number with format ORD-XXXXX
  const generateOrderNumber = (index) => {
    return `ORD-${String(10000 + index).padStart(5, '0')}`;
  };

  // Generate random set of products for the order
  const getRandomProducts = () => {
    const count = Math.floor(Math.random() * 4) + 1; // 1 to 4 products
    const orderProducts = [];
    const selectedProductIndices = new Set();

    while (selectedProductIndices.size < count) {
      const randomIndex = Math.floor(Math.random() * products.length);
      if (!selectedProductIndices.has(randomIndex)) {
        selectedProductIndices.add(randomIndex);
        const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
        const product = products[randomIndex];
        orderProducts.push({
          ...product,
          quantity,
          totalPrice: product.price * quantity
        });
      }
    }

    return orderProducts;
  };

  // Generate random tracking number
  const generateTrackingNumber = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Generate random notes
  const generateNotes = () => {
    const notes = [
      'Customer requested gift wrapping',
      'Send delivery confirmation email',
      'Fragile items - handle with care',
      'Contact customer before shipping',
      'Address verified by customer service',
      'Do not leave package unattended',
      'Priority handling requested',
      '',
      '',
      ''
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  };

  // Generate orders
  return Array.from({ length: count }, (_, index) => {
    const orderProducts = getRandomProducts();
    const subtotal = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
    const shippingCost = Math.random() > 0.3 ? 9.99 : 0; // 70% have shipping cost
    const taxRate = 0.08; // 8% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + shippingCost + taxAmount;
    
    const createdAt = randomDate();
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const shippingMethod = shippingMethods[Math.floor(Math.random() * shippingMethods.length)];
    
    // For orders that are shipped or delivered, generate tracking number
    const hasTracking = ['Shipped', 'Delivered'].includes(status);
    const trackingNumber = hasTracking ? generateTrackingNumber() : null;
    const notes = generateNotes();
    
    return {
      orderNumber: generateOrderNumber(index),
      customer,
      products: orderProducts,
      status,
      paymentMethod,
      shippingMethod,
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000), // 0-2 days after creation
      notes,
      trackingNumber,
      billingAddress: customer.address,
      shippingAddress: customer.address,
      paymentDetails: {
        method: paymentMethod,
        cardLast4: paymentMethod === 'Credit Card' ? String(1000 + Math.floor(Math.random() * 9000)).slice(-4) : null,
        transactionId: `TXN-${Math.floor(Math.random() * 1000000)}`,
      }
    };
  });
};

// Generate random sales data for charts
export const generateSalesData = (days = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - 1 - i));
    
    data.push({
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 10000) + 2000, // Random value between 2000-12000
      orders: Math.floor(Math.random() * 50) + 10, // Random value between 10-60
    });
  }
  
  return data;
};

// Generate product performance data
export const generateProductPerformanceData = () => {
  const productNames = [
    'Premium Headphones',
    'Wireless Mouse',
    'Smart Watch',
    'Bluetooth Speaker',
    'Mechanical Keyboard',
    'Laptop Stand',
    'External SSD',
    'Noise-Canceling Earbuds',
    'Webcam HD Pro',
    'USB-C Hub',
  ];
  
  return productNames.map(name => ({
    name,
    sales: Math.floor(Math.random() * 5000) + 500,
    revenue: Math.floor(Math.random() * 50000) + 5000,
    growth: (Math.random() * 40 - 10).toFixed(1) // -10% to +30%
  }));
}; 