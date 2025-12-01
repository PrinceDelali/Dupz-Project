import Quote from '../models/Quote.js';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/quotes';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, `quote-${Date.now()}-${path.basename(file.originalname)}`);
  }
});

// Set up multer for file uploads
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: function(req, file, cb) {
    // Accept images, PDFs, and common document formats
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image, PDF, and document files are allowed!'));
  }
}).array('files', 5); // Allow up to 5 files

// Helper for handling file uploads
const handleUpload = asyncHandler(async (req, res, next) => {
  return new Promise((resolve, reject) => {
    upload(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        reject({ message: `Multer error: ${err.message}`, statusCode: 400 });
      } else if (err) {
        reject({ message: err.message, statusCode: 400 });
      }
      resolve();
    });
  });
});

// @desc    Submit a new quote request
// @route   POST /api/quotes
// @access  Public
const submitQuote = asyncHandler(async (req, res) => {
  try {
    // Handle file uploads
    await handleUpload(req, res);
    
    // Parse the quote data
    const quoteData = JSON.parse(req.body.quoteData);
    
    // Process file information
    const fileInfos = req.files ? req.files.map(file => {
      console.log('File uploaded:', {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path
      });
      
      // Make sure path doesn't have duplicate uploads/ prefix
      const normalizedPath = file.path.replace(/^\.\/uploads\//, '');
      
      return {
        filename: file.filename,
        originalname: file.originalname,
        path: normalizedPath,
        size: file.size,
        mimetype: file.mimetype
      };
    }) : [];
    
    console.log('All files saved:', fileInfos);
    
    // Create the quote
    const quote = await Quote.create({
      ...quoteData,
      files: fileInfos
    });
    
    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      quoteId: quote._id
    });
  } catch (error) {
    // Clean up any uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'An error occurred while submitting your quote request'
    });
  }
});

// @desc    Get all quotes with pagination and filtering
// @route   GET /api/admin/quotes
// @access  Admin/Staff
const getQuotes = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    pageSize = 10, 
    status, 
    search,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  // Build the filter object
  const filter = {};
  
  // Add status filter if provided
  if (status) {
    filter.status = status;
  }
  
  // Add date range filter if provided
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  // Enhanced search functionality
  if (search && search.trim() !== '') {
    const searchTerms = search.trim().split(/\s+/);
    
    // Create OR conditions for each field and each term
    const searchConditions = [];
    
    // Fields to search in
    const searchFields = ['name', 'email', 'company', 'productType', 'description', 'quantity', 'targetPrice'];
    
    // For each search term, create conditions for each field
    searchTerms.forEach(term => {
      const termRegex = new RegExp(term, 'i');
      
      searchFields.forEach(field => {
        const condition = {};
        condition[field] = termRegex;
        searchConditions.push(condition);
      });
    });
    
    // If we have search conditions, add them to the filter using $or
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }
    
    // Log the search filter for debugging
    console.log('Search filter:', JSON.stringify(filter, null, 2));
  }
  
  // Build the sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  // Calculate skip value for pagination
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  
  // Get total count of matching documents
  const totalItems = await Quote.countDocuments(filter);
  
  // Get paginated quotes
  const quotes = await Quote.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(pageSize))
    .lean();
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / parseInt(pageSize));
  
  res.status(200).json({
    success: true,
    quotes,
    pagination: {
      totalItems,
      totalPages,
      currentPage: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

// @desc    Get a single quote by ID
// @route   GET /api/admin/quotes/:id
// @access  Admin/Staff
const getQuoteById = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  
  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }
  
  res.status(200).json(quote);
});

// @desc    Update quote status
// @route   PATCH /api/admin/quotes/:id/status
// @access  Admin/Staff
const updateQuoteStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'reviewing', 'quoted', 'negotiating', 'accepted', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }
  
  const quote = await Quote.findById(req.params.id);
  
  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }
  
  // Update quote status
  quote.status = status;
  
  // Add admin note if provided
  if (notes) {
    quote.adminNotes.push({
      note: notes,
      createdBy: req.user._id
    });
  }
  
  await quote.save();
  
  res.status(200).json({
    success: true,
    message: 'Quote status updated successfully',
    quote
  });
});

// @desc    Add a note to quote
// @route   POST /api/admin/quotes/:id/notes
// @access  Admin/Staff
const addQuoteNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  
  if (!note) {
    res.status(400);
    throw new Error('Note text is required');
  }
  
  const quote = await Quote.findById(req.params.id);
  
  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }
  
  quote.adminNotes.push({
    note,
    createdBy: req.user._id
  });
  
  await quote.save();
  
  res.status(200).json({
    success: true,
    message: 'Note added successfully',
    note: quote.adminNotes[quote.adminNotes.length - 1]
  });
});

// @desc    Delete a quote
// @route   DELETE /api/admin/quotes/:id
// @access  Admin only
const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  
  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }
  
  // Delete any associated files
  if (quote.files && quote.files.length > 0) {
    quote.files.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) console.error('Error deleting file:', err);
      });
    });
  }
  
  await quote.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Quote deleted successfully'
  });
});

export {
  submitQuote,
  getQuotes,
  getQuoteById,
  updateQuoteStatus,
  addQuoteNote,
  deleteQuote
}; 