import Collection from '../models/Collection.js';
import Product from '../models/Product.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc      Get all collections
// @route     GET /api/v1/collections
// @access    Public
export const getCollections = asyncHandler(async (req, res, next) => {
  let query;
  
  // Copy req.query
  const reqQuery = { ...req.query };
  
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
  
  // Remove fields from query
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators like $gt, $gte, etc
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Finding resource
  query = Collection.find(JSON.parse(queryStr));
  
  // Handle search
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    query = query.or([
      { name: regex },
      { description: regex }
    ]);
  }

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Collection.countDocuments(query);
  
  query = query.skip(startIndex).limit(limit);
  
  // Execute query
  const collections = await query;
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: collections.length,
    total,
    pagination,
    data: collections
  });
});

// @desc      Get single collection
// @route     GET /api/v1/collections/:id
// @access    Public
export const getCollection = asyncHandler(async (req, res, next) => {
  const collection = await Collection.findById(req.params.id).populate('products');
  
  if (!collection) {
    return next(
      new ErrorResponse(`Collection not found with id of ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: collection
  });
});

// @desc      Create collection
// @route     POST /api/v1/collections
// @access    Private
export const createCollection = asyncHandler(async (req, res, next) => {
  const collection = await Collection.create(req.body);
  
  res.status(201).json({
    success: true,
    data: collection
  });
});

// @desc      Update collection
// @route     PUT /api/v1/collections/:id
// @access    Private
export const updateCollection = asyncHandler(async (req, res, next) => {
  let collection = await Collection.findById(req.params.id);
  
  if (!collection) {
    return next(
      new ErrorResponse(`Collection not found with id of ${req.params.id}`, 404)
    );
  }
  
  collection = await Collection.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: collection
  });
});

// @desc      Delete collection
// @route     DELETE /api/v1/collections/:id
// @access    Private
export const deleteCollection = asyncHandler(async (req, res, next) => {
  const collection = await Collection.findById(req.params.id);
  
  if (!collection) {
    return next(
      new ErrorResponse(`Collection not found with id of ${req.params.id}`, 404)
    );
  }
  
  await Collection.deleteOne({ _id: req.params.id });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Add product to collection
// @route     POST /api/v1/collections/:id/products
// @access    Private
export const addProductToCollection = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  
  if (!productId) {
    return next(new ErrorResponse('Please provide a product ID', 400));
  }
  
  // Check if collection exists
  const collection = await Collection.findById(req.params.id);
  
  if (!collection) {
    return next(
      new ErrorResponse(`Collection not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if product exists
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${productId}`, 404)
    );
  }
  
  // Check if product is already in the collection
  if (collection.products.includes(productId)) {
    return next(
      new ErrorResponse(`Product ${productId} is already in this collection`, 400)
    );
  }
  
  // Add product to collection
  collection.products.push(productId);
  await collection.save();
  
  res.status(200).json({
    success: true,
    data: collection
  });
});

// @desc      Remove product from collection
// @route     DELETE /api/v1/collections/:id/products/:productId
// @access    Private
export const removeProductFromCollection = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  
  // Check if collection exists
  const collection = await Collection.findById(req.params.id);
  
  if (!collection) {
    return next(
      new ErrorResponse(`Collection not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if product is in the collection
  if (!collection.products.includes(productId)) {
    return next(
      new ErrorResponse(`Product ${productId} is not in this collection`, 400)
    );
  }
  
  // Remove product from collection
  collection.products = collection.products.filter(
    product => product.toString() !== productId
  );
  
  await collection.save();
  
  res.status(200).json({
    success: true,
    data: collection
  });
}); 