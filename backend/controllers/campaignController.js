import Campaign from '../models/campaignModel.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import ErrorResponse from '../utils/errorResponse.js';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get recipient emails based on recipientType
const getRecipientEmails = async (recipientType) => {
  let filter = { active: true };
  
  // Filter users based on recipientType
  switch (recipientType) {
    case 'active':
      filter.lastActive = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // Active in last 30 days
      break;
    case 'recent':
      filter.createdAt = { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }; // Created in last 14 days
      break;
    case 'dormant':
      filter.lastActive = { $lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }; // Not active in 90+ days
      break;
    // If 'all' or any other value, use default filter (active users)
  }
  
  // Get user emails
  const users = await User.find(filter).select('email');
  return users.map(user => user.email);
};

// Helper function to create HTML email content
const createEmailHtml = (campaign, trackingId) => {
  // Basic template with tracking pixel
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${campaign.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${campaign.content}
        <br>
        <hr>
        <small>
          If you no longer wish to receive these emails, please <a href="${process.env.FRONTEND_URL}/unsubscribe?id=${trackingId}">unsubscribe</a>.
        </small>
        <img src="${process.env.BACKEND_URL}/api/campaigns/track-open/${trackingId}" width="1" height="1" style="display:none" alt="">
      </div>
    </body>
    </html>
  `;
};

export const getAllCampaigns = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter based on search query
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { subject: { $regex: req.query.search, $options: 'i' } },
      { type: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Add filter for admin user only
  filter.createdBy = req.user.id;
  
  // Get campaigns with pagination
  const campaigns = await Campaign.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Get total count for pagination
  const total = await Campaign.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: campaigns.length,
    total,
    pages: Math.ceil(total / limit),
    data: campaigns
  });
});

export const getCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new ErrorResponse('No campaign found with that ID', 404));
  }
  
  // Check if user is authorized to access this campaign
  if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('You do not have permission to access this campaign', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: campaign
  });
});

export const createCampaign = catchAsync(async (req, res, next) => {
  // Add user ID to campaign data
  req.body.createdBy = req.user.id;
  
  // Create campaign
  const newCampaign = await Campaign.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: newCampaign
  });
});

export const updateCampaign = catchAsync(async (req, res, next) => {
  // Find campaign
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new ErrorResponse('No campaign found with that ID', 404));
  }
  
  // Check if user is authorized to update this campaign
  if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('You do not have permission to update this campaign', 403));
  }
  
  // Prevent updating if campaign is already sent
  if (campaign.status === 'sent' && req.body.status !== 'sent') {
    return next(new ErrorResponse('Cannot update a campaign that has already been sent', 400));
  }
  
  // Update campaign
  const updatedCampaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: updatedCampaign
  });
});

export const deleteCampaign = catchAsync(async (req, res, next) => {
  // Find campaign
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new ErrorResponse('No campaign found with that ID', 404));
  }
  
  // Check if user is authorized to delete this campaign
  if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('You do not have permission to delete this campaign', 403));
  }
  
  // Prevent deleting if campaign is already sent
  if (campaign.status === 'sent') {
    return next(new ErrorResponse('Cannot delete a campaign that has already been sent', 400));
  }
  
  // Delete campaign
  await Campaign.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Send campaign to recipients
export const sendCampaign = catchAsync(async (req, res, next) => {
  // Find campaign
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new ErrorResponse('No campaign found with that ID', 404));
  }
  
  // Check if user is authorized to send this campaign
  if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('You do not have permission to send this campaign', 403));
  }
  
  // Check if campaign is in a state that can be sent
  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    return next(new ErrorResponse(`Cannot send campaign with status: ${campaign.status}`, 400));
  }
  
  // Get recipient type from request or use campaign's recipientType
  const recipientType = req.body.recipientType || campaign.recipientType;
  
  // Get recipient emails based on type
  const recipientEmails = await getRecipientEmails(recipientType);
  
  if (recipientEmails.length === 0) {
    return next(new ErrorResponse('No recipients found for this campaign', 400));
  }
  
  try {
    // Update campaign status to sending
    campaign.status = 'sending';
    campaign.recipientCount = recipientEmails.length;
    await campaign.save();
    
    // Create unique tracking ID for this campaign
    const trackingId = campaign._id.toString();
    
    // Format email content with tracking pixel
    const htmlContent = createEmailHtml(campaign, trackingId);
    
    // Send emails using Resend
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@sinosply.com',
      to: recipientEmails,
      subject: campaign.subject,
      html: htmlContent,
      tags: [
        {
          name: 'campaign_id',
          value: campaign._id.toString(),
        },
      ],
    });
    
    // Update campaign with sending results
    campaign.status = 'sent';
    campaign.sent = recipientEmails.length;
    campaign.delivered = recipientEmails.length; // Optimistic - will be updated by webhooks
    campaign.sentAt = new Date();
    campaign.serviceId = response.id;
    await campaign.save();
    
    res.status(200).json({
      status: 'success',
      recipientCount: recipientEmails.length,
      data: campaign
    });
  } catch (error) {
    // Update campaign status to failed
    campaign.status = 'failed';
    await campaign.save();
    
    return next(new ErrorResponse(`Failed to send campaign: ${error.message}`, 500));
  }
});

// Track email opens
export const trackEmailOpen = catchAsync(async (req, res, next) => {
  const campaignId = req.params.id;
  
  // Find campaign
  const campaign = await Campaign.findById(campaignId);
  
  if (!campaign) {
    // Return a 1x1 transparent pixel even if campaign not found
    res.set('Content-Type', 'image/gif');
    return res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
  
  // Update open count
  campaign.opened += 1;
  await campaign.save();
  
  // Return a 1x1 transparent pixel
  res.set('Content-Type', 'image/gif');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

// Track email clicks
export const trackEmailClick = catchAsync(async (req, res, next) => {
  const campaignId = req.params.id;
  const redirectUrl = req.query.url || process.env.FRONTEND_URL;
  
  // Find campaign
  const campaign = await Campaign.findById(campaignId);
  
  if (campaign) {
    // Update click count
    campaign.clicked += 1;
    await campaign.save();
  }
  
  // Redirect user to the target URL
  res.redirect(redirectUrl);
});

// Get campaign statistics
export const getCampaignStats = catchAsync(async (req, res, next) => {
  const stats = await Campaign.aggregate([
    {
      $match: { createdBy: req.user._id }
    },
    {
      $group: {
        _id: null,
        totalCampaigns: { $sum: 1 },
        sentCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        totalRecipients: { $sum: '$recipientCount' },
        totalOpens: { $sum: '$opened' },
        totalClicks: { $sum: '$clicked' },
      }
    },
    {
      $project: {
        _id: 0,
        totalCampaigns: 1,
        sentCampaigns: 1,
        totalRecipients: 1,
        totalOpens: 1,
        totalClicks: 1,
        avgOpenRate: {
          $cond: [
            { $gt: ['$totalRecipients', 0] },
            { $multiply: [{ $divide: ['$totalOpens', '$totalRecipients'] }, 100] },
            0
          ]
        },
        avgClickRate: {
          $cond: [
            { $gt: ['$totalOpens', 0] },
            { $multiply: [{ $divide: ['$totalClicks', '$totalOpens'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: stats.length > 0 ? stats[0] : {
      totalCampaigns: 0,
      sentCampaigns: 0,
      totalRecipients: 0,
      totalOpens: 0,
      totalClicks: 0,
      avgOpenRate: 0,
      avgClickRate: 0
    }
  });
}); 