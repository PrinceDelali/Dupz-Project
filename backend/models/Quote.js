import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  company: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  productType: {
    type: String,
    required: [true, 'Product type is required']
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  targetPrice: {
    type: String,
    default: ''
  },
  deadline: {
    type: String,
    default: ''
  },
  additionalRequirements: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'quoted', 'negotiating', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  files: [{
    filename: String,
    originalname: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  notes: {
    type: String,
    default: ''
  },
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true 
});

// Add text index for search functionality
QuoteSchema.index({ 
  name: 'text', 
  email: 'text', 
  company: 'text', 
  productType: 'text', 
  description: 'text',
  quantity: 'text',
  targetPrice: 'text'
});

// Add individual field indexes for regex searches
QuoteSchema.index({ name: 1 });
QuoteSchema.index({ email: 1 });
QuoteSchema.index({ company: 1 });
QuoteSchema.index({ productType: 1 });
QuoteSchema.index({ description: 1 });
QuoteSchema.index({ quantity: 1 });
QuoteSchema.index({ targetPrice: 1 });
QuoteSchema.index({ status: 1 });
QuoteSchema.index({ createdAt: 1 });

const Quote = mongoose.model('Quote', QuoteSchema);
export default Quote; 