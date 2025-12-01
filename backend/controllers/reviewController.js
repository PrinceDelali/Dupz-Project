import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import asyncHandler from '../middleware/async.js';
import mongoose from 'mongoose';

// @desc    Get all reviews for a product
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit = 10, page = 1, sort = 'newest' } = req.query;
  
  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Determine sort order
  let sortOption = {};
  if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'highest') {
    sortOption = { rating: -1 };
  } else if (sort === 'lowest') {
    sortOption = { rating: 1 };
  } else if (sort === 'helpful') {
    sortOption = { helpfulVotes: -1 };
  }

  // Get approved reviews for the product
  const reviews = await Review.find({ 
    product: productId,
    status: 'approved'
  })
    .populate('user', 'firstName lastName _id')
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));
  
  // Get total count for pagination
  const totalReviews = await Review.countDocuments({ 
    product: productId,
    status: 'approved'
  });

  // Get aggregated rating stats
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        ratings: {
          $push: '$rating'
        }
      }
    },
    { $project: {
        _id: 0,
        avgRating: { $round: ['$avgRating', 1] },
        reviewCount: 1,
        ratingDistribution: {
          1: { $size: { $filter: { input: '$ratings', as: 'r', cond: { $eq: ['$$r', 1] } } } },
          2: { $size: { $filter: { input: '$ratings', as: 'r', cond: { $eq: ['$$r', 2] } } } },
          3: { $size: { $filter: { input: '$ratings', as: 'r', cond: { $eq: ['$$r', 3] } } } },
          4: { $size: { $filter: { input: '$ratings', as: 'r', cond: { $eq: ['$$r', 4] } } } },
          5: { $size: { $filter: { input: '$ratings', as: 'r', cond: { $eq: ['$$r', 5] } } } }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: reviews.length,
    total: totalReviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalReviews / parseInt(limit))
    },
    stats: stats.length > 0 ? stats[0] : {
      avgRating: 0,
      reviewCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    data: reviews
  });
});

// @desc    Get a single review
// @route   GET /api/v1/reviews/:id
// @access  Public
export const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'firstName lastName _id')
    .populate('replies.user', 'firstName lastName _id');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Create a review for a product
// @route   POST /api/v1/products/:productId/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  req.body.product = req.params.productId;
  req.body.user = req.user.id;
  
  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }

  // Check if product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user has already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user.id,
    product: req.params.productId
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product'
    });
  }

  // Check if user has purchased the product
  const userOrders = await Order.find({
    user: req.user.id,
    status: { $in: ['Delivered', 'Completed'] }
  });

  // Find if this product is in any of the user's completed orders
  const hasPurchased = userOrders.some(order => 
    order.items.some(item => item.productId.toString() === req.params.productId)
  );

  // Set verified purchase flag
  req.body.isVerifiedPurchase = hasPurchased;

  // Create the review
  const review = await Review.create(req.body);

  // Respond with the review
  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Ensure user owns the review or is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  // Only allow updating rating, title, and comment
  const { rating, title, comment } = req.body;
  const updateData = {};
  
  if (rating !== undefined) updateData.rating = rating;
  if (title !== undefined) updateData.title = title;
  if (comment !== undefined) updateData.comment = comment;

  // Update the review
  review = await Review.findByIdAndUpdate(
    req.params.id, 
    updateData, 
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Ensure user owns the review or is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Vote on review helpfulness
// @route   POST /api/v1/reviews/:id/vote
// @access  Private
export const voteOnReview = asyncHandler(async (req, res) => {
  const { voteType } = req.body;
  
  if (!['helpful', 'unhelpful'].includes(voteType)) {
    return res.status(400).json({
      success: false,
      message: 'Vote type must be helpful or unhelpful'
    });
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user has already voted
  const existingVoteIndex = review.votedBy.findIndex(
    vote => vote.user.toString() === req.user.id
  );

  if (existingVoteIndex !== -1) {
    const existingVote = review.votedBy[existingVoteIndex];
    
    // If voting the same way, remove the vote
    if (existingVote.vote === voteType) {
      // Decrement vote count
      if (voteType === 'helpful') {
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      } else {
        review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
      }
      
      // Remove the vote record
      review.votedBy.splice(existingVoteIndex, 1);
    } else {
      // Change vote type
      if (existingVote.vote === 'helpful') {
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
        review.unhelpfulVotes += 1;
      } else {
        review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
        review.helpfulVotes += 1;
      }
      
      // Update vote type
      review.votedBy[existingVoteIndex].vote = voteType;
    }
  } else {
    // Add new vote
    if (voteType === 'helpful') {
      review.helpfulVotes += 1;
    } else {
      review.unhelpfulVotes += 1;
    }
    
    // Add vote record
    review.votedBy.push({
      user: req.user.id,
      vote: voteType
    });
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: {
      helpfulVotes: review.helpfulVotes,
      unhelpfulVotes: review.unhelpfulVotes
    }
  });
});

// @desc    Add reply to a review
// @route   POST /api/v1/reviews/:id/replies
// @access  Private
export const addReviewReply = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Reply content is required'
    });
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Add reply
  const reply = {
    user: req.user.id,
    content,
    createdAt: Date.now()
  };

  review.replies.push(reply);
  await review.save();

  // Get the populated reply
  const populatedReview = await Review.findById(req.params.id)
    .populate('replies.user', 'firstName lastName _id');

  const addedReply = populatedReview.replies[populatedReview.replies.length - 1];

  res.status(201).json({
    success: true,
    data: addedReply
  });
});

// @desc    Update a reply
// @route   PUT /api/v1/reviews/:id/replies/:replyId
// @access  Private
export const updateReviewReply = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Reply content is required'
    });
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Find the reply
  const reply = review.replies.id(req.params.replyId);

  if (!reply) {
    return res.status(404).json({
      success: false,
      message: 'Reply not found'
    });
  }

  // Ensure user owns the reply or is admin
  if (reply.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this reply'
    });
  }

  // Update reply
  reply.content = content;
  await review.save();

  res.status(200).json({
    success: true,
    data: reply
  });
});

// @desc    Delete a reply
// @route   DELETE /api/v1/reviews/:id/replies/:replyId
// @access  Private
export const deleteReviewReply = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Find the reply
  const reply = review.replies.id(req.params.replyId);

  if (!reply) {
    return res.status(404).json({
      success: false,
      message: 'Reply not found'
    });
  }

  // Ensure user owns the reply or is admin
  if (reply.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this reply'
    });
  }

  // Remove reply
  review.replies.pull(req.params.replyId);
  await review.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Vote on reply helpfulness
// @route   POST /api/v1/reviews/:id/replies/:replyId/vote
// @access  Private
export const voteOnReply = asyncHandler(async (req, res) => {
  const { voteType } = req.body;
  
  if (!['helpful', 'unhelpful'].includes(voteType)) {
    return res.status(400).json({
      success: false,
      message: 'Vote type must be helpful or unhelpful'
    });
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Find the reply
  const reply = review.replies.id(req.params.replyId);

  if (!reply) {
    return res.status(404).json({
      success: false,
      message: 'Reply not found'
    });
  }

  // Check if user has already voted
  const existingVoteIndex = reply.votedBy.findIndex(
    vote => vote.user.toString() === req.user.id
  );

  if (existingVoteIndex !== -1) {
    const existingVote = reply.votedBy[existingVoteIndex];
    
    // If voting the same way, remove the vote
    if (existingVote.vote === voteType) {
      // Decrement vote count
      if (voteType === 'helpful') {
        reply.helpfulVotes = Math.max(0, reply.helpfulVotes - 1);
      } else {
        reply.unhelpfulVotes = Math.max(0, reply.unhelpfulVotes - 1);
      }
      
      // Remove the vote record
      reply.votedBy.splice(existingVoteIndex, 1);
    } else {
      // Change vote type
      if (existingVote.vote === 'helpful') {
        reply.helpfulVotes = Math.max(0, reply.helpfulVotes - 1);
        reply.unhelpfulVotes += 1;
      } else {
        reply.unhelpfulVotes = Math.max(0, reply.unhelpfulVotes - 1);
        reply.helpfulVotes += 1;
      }
      
      // Update vote type
      reply.votedBy[existingVoteIndex].vote = voteType;
    }
  } else {
    // Add new vote
    if (voteType === 'helpful') {
      reply.helpfulVotes += 1;
    } else {
      reply.unhelpfulVotes += 1;
    }
    
    // Add vote record
    reply.votedBy.push({
      user: req.user.id,
      vote: voteType
    });
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: {
      helpfulVotes: reply.helpfulVotes,
      unhelpfulVotes: reply.unhelpfulVotes
    }
  });
}); 