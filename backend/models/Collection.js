import mongoose from 'mongoose';
import slugify from 'slugify';

const CollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a collection name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    slug: {
      type: String,
      unique: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    image: {
      type: String
    },
    featured: {
      type: Boolean,
      default: false
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create collection slug from the name
CollectionSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Virtual for product count
CollectionSchema.virtual('productCount').get(function() {
  return this.products ? this.products.length : 0;
});

const Collection = mongoose.model('Collection', CollectionSchema);

export default Collection; 