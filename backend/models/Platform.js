import mongoose from 'mongoose';
import slugify from 'slugify';

const platformSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A platform must have a name'],
      unique: true,
      trim: true,
      maxlength: [100, 'A platform name cannot be more than 100 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A platform must have a description']
    },
    longDescription: {
      type: String,
      trim: true
    },
    logoUrl: {
      type: String,
      required: [true, 'A platform must have a logo']
    },
    bannerUrl: {
      type: String
    },
    domain: {
      type: String,
      required: [true, 'A platform must have a domain'],
      unique: true,
      trim: true
    },
    theme: {
      type: String,
      default: 'default'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    productCategories: {
      type: [String]
    },
    featuredProducts: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    }],
    salesCount: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A platform must belong to a user']
    },
    settings: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create platform slug before saving
platformSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Virtual populate with products
platformSchema.virtual('products', {
  ref: 'Product',
  foreignField: 'platform',
  localField: '_id'
});

// Virtual populate with featured products
platformSchema.virtual('featuredProductsList', {
  ref: 'Product',
  foreignField: '_id',
  localField: 'featuredProducts'
});

const Platform = mongoose.model('Platform', platformSchema);

export default Platform; 