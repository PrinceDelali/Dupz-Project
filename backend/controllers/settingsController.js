import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import Settings from '../models/Settings.js';

// @desc    Get all settings
// @route   GET /api/v1/settings
// @access  Public
export const getSettings = asyncHandler(async (req, res, next) => {
  const settings = await Settings.getSettings();
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update settings
// @route   PUT /api/v1/settings
// @access  Private/Admin
export const updateSettings = asyncHandler(async (req, res, next) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    // Update each field if provided
    Object.keys(req.body).forEach(key => {
      settings[key] = req.body[key];
    });
    
    await settings.save();
  }
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Get banners
// @route   GET /api/v1/settings/banners
// @access  Public
export const getBanners = asyncHandler(async (req, res, next) => {
  const settings = await Settings.getSettings();
  const activeBanners = settings.banners.filter(banner => banner.isActive);
  
  res.status(200).json({
    success: true,
    data: activeBanners
  });
});

// @desc    Update banners
// @route   PUT /api/v1/settings/banners
// @access  Private/Admin
export const updateBanners = asyncHandler(async (req, res, next) => {
  if (!req.body || !Array.isArray(req.body)) {
    return next(new ErrorResponse('Please provide an array of banners', 400));
  }
  
  const settings = await Settings.getSettings();
  settings.banners = req.body;
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: settings.banners
  });
});

// @desc    Update a specific banner by type
// @route   PUT /api/v1/settings/banners/:type
// @access  Private/Admin
export const updateBannerByType = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const validTypes = ['topBanner', 'heroBanner', 'promoBanner'];
  
  if (!validTypes.includes(type)) {
    return next(new ErrorResponse(`Invalid banner type: ${type}`, 400));
  }
  
  if (!req.body || !req.body.imageUrl) {
    return next(new ErrorResponse('Please provide banner details including imageUrl', 400));
  }
  
  const settings = await Settings.getSettings();
  const bannerIndex = settings.banners.findIndex(banner => banner.type === type);
  
  if (bannerIndex >= 0) {
    // Update existing banner
    settings.banners[bannerIndex] = {
      ...settings.banners[bannerIndex],
      ...req.body,
      type // Ensure type is preserved
    };
  } else {
    // Add new banner
    settings.banners.push({
      type,
      ...req.body
    });
  }
  
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: settings.banners.find(banner => banner.type === type)
  });
});

// @desc    Get shipping methods
// @route   GET /api/v1/settings/shipping
// @access  Public
export const getShippingMethods = asyncHandler(async (req, res, next) => {
  const settings = await Settings.getSettings();
  const activeMethods = settings.shippingMethods.filter(method => method.isActive);
  
  res.status(200).json({
    success: true,
    data: activeMethods
  });
});

// @desc    Update shipping methods
// @route   PUT /api/v1/settings/shipping
// @access  Private/Admin
export const updateShippingMethods = asyncHandler(async (req, res, next) => {
  if (!req.body || !Array.isArray(req.body)) {
    return next(new ErrorResponse('Please provide an array of shipping methods', 400));
  }
  
  const settings = await Settings.getSettings();
  settings.shippingMethods = req.body;
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: settings.shippingMethods
  });
});

// @desc    Get tax rates
// @route   GET /api/v1/settings/tax
// @access  Public
export const getTaxRates = asyncHandler(async (req, res, next) => {
  const settings = await Settings.getSettings();
  const activeTaxRates = settings.taxRates.filter(tax => tax.isActive);
  
  res.status(200).json({
    success: true,
    data: activeTaxRates
  });
});

// @desc    Update tax rates
// @route   PUT /api/v1/settings/tax
// @access  Private/Admin
export const updateTaxRates = asyncHandler(async (req, res, next) => {
  if (!req.body || !Array.isArray(req.body)) {
    return next(new ErrorResponse('Please provide an array of tax rates', 400));
  }
  
  const settings = await Settings.getSettings();
  settings.taxRates = req.body;
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: settings.taxRates
  });
});

// @desc    Update default tax rate
// @route   PUT /api/v1/settings/tax/default
// @access  Private/Admin
export const updateDefaultTaxRate = asyncHandler(async (req, res, next) => {
  if (req.body.defaultTaxRate === undefined) {
    return next(new ErrorResponse('Please provide a default tax rate', 400));
  }
  
  const settings = await Settings.getSettings();
  settings.defaultTaxRate = req.body.defaultTaxRate;
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: { defaultTaxRate: settings.defaultTaxRate }
  });
}); 