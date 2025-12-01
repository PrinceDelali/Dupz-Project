import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import { getProductReviews, createReview } from '../controllers/reviewController.js';
import reviewRoutes from './reviewRoutes.js';

// Product review routes - directly define them here, don't reroute
router
  .route('/:productId/reviews')
  .get(getProductReviews)
  .post(protect, createReview);

// @route   POST /api/v1/products
// @desc    Create a new product
// @access  Private (Admin only)
router.post('/', protect, adminAuth, async (req, res) => {
  try {
    // Extract product data from request body
    const productData = {
      name: req.body.name,
      basePrice: Number(req.body.basePrice),
      salePrice: Number(req.body.salePrice) || 0,
      description: req.body.description,
      category: req.body.category,
      details: req.body.details || [],
      variants: req.body.variants || [],
      sizes: req.body.sizes || [],
      stock: parseInt(req.body.stock) || 0,
      // Add shipping fields
      airShippingPrice: Number(req.body.airShippingPrice) || 0,
      airShippingDuration: Number(req.body.airShippingDuration) || 7,
      seaShippingPrice: Number(req.body.seaShippingPrice) || 0,
      seaShippingDuration: Number(req.body.seaShippingDuration) || 30,
      sku: req.body.sku, // Optional, will be generated if not provided
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isFeatured: req.body.isFeatured || false,
      isSample: req.body.isSample || false,
      platformId: req.body.platformId || null, // Add platform ID
      tags: req.body.tags || [],
      createdBy: req.user.id // Add the user who created the product
    };

    // Create new product
    const product = new Product(productData);
    await product.save();

    // Return success response
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({
        success: false,
        error: 'A product with this name or SKU already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   GET /api/v1/products
// @desc    Get all products with pagination and filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build query from request parameters
    const query = {};
    
    // Category filter
    if (req.query.category) {
      query.category = { $regex: new RegExp('^' + req.query.category + '$', 'i') }; // Case-insensitive exact match
    }
    
    // Active products only (for public API)
    if (!req.query.showAll) {
      query.isActive = true;
    }
    
    // Featured products filter
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }
    
    // Sample products filter
    if (req.query.isSample === 'true') {
      query.isSample = true;
      console.log('Filtering for sample products');
    }
    
    // Platform filter
    if (req.query.platformId) {
      query.platformId = req.query.platformId;
    }
    
    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Execute query with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/v1/products/clear-all
// @desc    Delete all products
// @access  Private (Admin only)
router.delete('/clear-all', protect, adminAuth, async (req, res) => {
  try {
    // Delete all products from the database
    await Product.deleteMany({});
    
    res.json({
      success: true,
      message: 'All products have been deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting all products:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   GET /api/v1/products/platform/:platformId
// @desc    Get products by platform ID
// @access  Public
router.get('/platform/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    if (!mongoose.Types.ObjectId.isValid(platformId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform ID'
      });
    }
    
    const query = { 
      platformId,
      isActive: !req.query.showAll ? true : undefined
    };
    
    // Category filter
    if (req.query.category) {
      query.category = { $regex: new RegExp('^' + req.query.category + '$', 'i') }; // Case-insensitive exact match
    }
    
    // Featured products filter
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }
    
    // Sample products filter
    if (req.query.isSample === 'true') {
      query.isSample = true;
      console.log('Filtering for sample products');
    }
    
    // Execute query with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching platform products:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   GET /api/v1/products/:id
// @desc    Get product by ID or slug
// @access  Public
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Build query to find by ID or slug
    const query = {
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(idOrSlug) ? idOrSlug : null },
        { slug: idOrSlug }
      ]
    };
    
    const product = await Product.findOne(query);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/v1/products/:id
// @desc    Update a product
// @access  Private (Admin only)
router.put('/:id', protect, adminAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find the product first to make sure it exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Extract updatable fields
    const updateData = {};
    
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.basePrice) updateData.basePrice = Number(req.body.basePrice);
    if (req.body.salePrice !== undefined) updateData.salePrice = Number(req.body.salePrice);
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.details) updateData.details = req.body.details;
    if (req.body.variants) updateData.variants = req.body.variants;
    if (req.body.sizes) updateData.sizes = req.body.sizes;
    if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
    // Add shipping fields
    if (req.body.airShippingPrice !== undefined) updateData.airShippingPrice = Number(req.body.airShippingPrice);
    if (req.body.airShippingDuration !== undefined) updateData.airShippingDuration = Number(req.body.airShippingDuration);
    if (req.body.seaShippingPrice !== undefined) updateData.seaShippingPrice = Number(req.body.seaShippingPrice);
    if (req.body.seaShippingDuration !== undefined) updateData.seaShippingDuration = Number(req.body.seaShippingDuration);
    if (req.body.sku) updateData.sku = req.body.sku;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured;
    if (req.body.isSample !== undefined) {
      updateData.isSample = req.body.isSample;
      console.log(`Updating product ${productId} - isSample: ${req.body.isSample}`);
    }
    if (req.body.platformId !== undefined) updateData.platformId = req.body.platformId;
    if (req.body.tags) updateData.tags = req.body.tags;
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A product with this name or SKU already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   PATCH /api/v1/products/:id/platform
// @desc    Update product platform
// @access  Private (Admin only)
router.patch('/:id/platform', protect, adminAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const { platformId } = req.body;
    
    // Validate platform ID if provided
    if (platformId && !mongoose.Types.ObjectId.isValid(platformId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform ID format'
      });
    }
    
    // Update product with new platform
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: { platformId: platformId || null } },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedProduct,
      message: platformId ? 'Product associated with platform' : 'Product removed from platform'
    });
  } catch (error) {
    console.error('Error updating product platform:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/v1/products/:id
// @desc    Delete a product
// @access  Private (Admin only)
router.delete('/:id', protect, adminAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find and delete product
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// @route   PATCH /api/v1/products/:id/stock
// @desc    Update product stock
// @access  Private (Admin only)
router.patch('/:id/stock', protect, adminAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const { stock } = req.body;
    
    // Validate stock is provided
    if (stock === undefined || stock === null) {
      return res.status(400).json({
        success: false,
        error: 'Stock quantity is required'
      });
    }
    
    // Update product stock
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: { stock: parseInt(stock) } },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

export default router; 