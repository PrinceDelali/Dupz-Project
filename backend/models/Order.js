import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true // Index for faster lookups
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow guest checkout
    index: true // Add index for faster user order lookups
  },
  items: [
    {
      productId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      image: String,
      sku: String,
      color: String,
      size: String
    }
  ],
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zip: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phone: String
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentDetails: {
    transactionId: String,
    status: String,
    cardDetails: {
      brand: String,
      last4: String
    }
  },
  paymentReceipt: {
    type: {
      type: String,
      enum: ['image', 'link', 'reference', 'test', 'none'],
      default: 'none'
    },
    imageData: String,
    link: String,
    uploadedAt: Date,
    note: String
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  trackingNumber: String,
  shippingMethod: String,
  shippingType: {
    type: String,
    enum: ['air', 'sea', 'standard', 'express', 'free'],
    default: 'standard'
  },
  estimatedDelivery: Date,
  notes: String,
  receiptId: String,
  customerEmail: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for fast search by common fields
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ trackingNumber: 1 });
OrderSchema.index({ user: 1 });

// Add compound index for the most common query pattern:
// find orders by user and sort by createdAt
OrderSchema.index({ user: 1, createdAt: -1 });

// Virtual for formatting order date
OrderSchema.virtual('formattedOrderDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Generate order number automatically before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(10000 + count).padStart(5, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', OrderSchema);

export default Order; 