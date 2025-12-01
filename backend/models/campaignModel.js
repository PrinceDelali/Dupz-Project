import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['email', 'notification', 'promo', 'discount', 'event'],
      default: 'email',
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Campaign content is required'],
    },
    template: {
      type: String,
      default: 'default',
    },
    recipientType: {
      type: String,
      enum: ['all', 'active', 'recent', 'dormant', 'segment'],
      default: 'all',
    },
    recipientSegment: {
      type: String,
      default: null,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'active', 'paused', 'failed'],
      default: 'draft',
    },
    // Tracking metrics
    sent: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: Number,
      default: 0,
    },
    opened: {
      type: Number,
      default: 0,
    },
    clicked: {
      type: Number,
      default: 0,
    },
    bounced: {
      type: Number,
      default: 0,
    },
    complained: {
      type: Number,
      default: 0,
    },
    uniqueOpens: {
      type: Number,
      default: 0,
    },
    uniqueClicks: {
      type: Number,
      default: 0,
    },
    // Tracking lists - used to prevent duplicate counting
    openedBy: {
      type: [String], // List of user IDs or emails that opened
      default: [],
      select: false, // Don't include this in regular queries
    },
    clickedBy: {
      type: [String], // List of user IDs or emails that clicked
      default: [],
      select: false, // Don't include this in regular queries
    },
    // Email service tracking
    serviceId: {
      type: String, // ID from the email service (e.g., Resend)
      default: null,
    },
    // Timestamps for tracking
    sentAt: {
      type: Date,
      default: null,
    },
    lastUpdatedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Campaign must belong to a user'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for open rate
campaignSchema.virtual('openRate').get(function() {
  if (this.sent === 0) return 0;
  return ((this.opened / this.sent) * 100).toFixed(1);
});

// Virtual property for click rate
campaignSchema.virtual('clickRate').get(function() {
  if (this.opened === 0) return 0;
  return ((this.clicked / this.opened) * 100).toFixed(1);
});

// Virtual property for delivery rate
campaignSchema.virtual('deliveryRate').get(function() {
  if (this.sent === 0) return 0;
  return ((this.delivered / this.sent) * 100).toFixed(1);
});

// Virtual property for bounce rate
campaignSchema.virtual('bounceRate').get(function() {
  if (this.sent === 0) return 0;
  return ((this.bounced / this.sent) * 100).toFixed(1);
});

// Index for faster queries
campaignSchema.index({ title: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ scheduledDate: 1 });
campaignSchema.index({ createdBy: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign; 