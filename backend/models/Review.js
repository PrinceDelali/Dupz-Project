import mongoose from 'mongoose';

// Schema for replies to reviews
const replySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    trim: true,
    maxlength: [500, 'Reply cannot be more than 500 characters']
  },
  // Helpfulness tracking
  helpfulVotes: {
    type: Number,
    default: 0
  },
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  // Users who have voted on this reply
  votedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['helpful', 'unhelpful']
    }
  }]
}, { 
  timestamps: true 
});

// Main Review Schema
const ReviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please add a review comment'],
    trim: true,
    maxlength: [1000, 'Review cannot be more than 1000 characters']
  },
  // For verified purchases
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  // Helpfulness tracking
  helpfulVotes: {
    type: Number,
    default: 0
  },
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  // Users who have voted on this review
  votedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['helpful', 'unhelpful']
    }
  }],
  // Replies to this review
  replies: [replySchema],
  // Status for moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, { 
  timestamps: true 
});

// Index for faster product-based queries
ReviewSchema.index({ product: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to calculate the average rating for a product
ReviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      ratings: stats[0].averageRating,
      reviewCount: stats[0].reviewCount
    });
  } else {
    // If no reviews exist, reset ratings to 0
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      ratings: 0,
      reviewCount: 0
    });
  }
};

// Call calculateAverageRating after save
ReviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.product);
});

// Call calculateAverageRating after remove
ReviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.product);
});

const Review = mongoose.model('Review', ReviewSchema);

export default Review; 