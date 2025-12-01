import mongoose from 'mongoose';

// Schema for product variants (colors and their images)
const variantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true
  },
  colorName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  additionalImages: {
    type: [String],
    default: []
  }
});

// Main Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  basePrice: {
    type: Number,
    required: [true, 'Product price is required']
  },
  salePrice: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    required: [true, 'Product category is required']
  },
  details: {
    type: [String],
    default: []
  },
  variants: {
    type: [variantSchema],
    default: []
  },
  sizes: {
    type: [String],
    default: []
  },
  stock: {
    type: Number,
    default: 0
  },
  airShippingPrice: {
    type: Number,
    default: 0,
    description: 'The price for shipping this product by air (per unit)'
  },
  airShippingDuration: {
    type: Number,
    default: 7,
    description: 'The estimated duration in days for air shipping'
  },
  seaShippingPrice: {
    type: Number,
    default: 0,
    description: 'The price for shipping this product by sea (per unit)'
  },
  seaShippingDuration: {
    type: Number,
    default: 30,
    description: 'The estimated duration in days for sea shipping'
  },
  sku: {
    type: String,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSample: {
    type: Boolean,
    default: false
  },
  platformId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform',
    default: null
  },
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Generate slug from product name before saving
productSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }
  
  // Generate SKU if not provided
  if (!this.sku) {
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    this.sku = `${categoryCode}-${randomPart}`;
  }
  
  next();
});

// Create index for improved search performance
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product; 