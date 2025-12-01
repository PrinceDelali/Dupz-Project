import mongoose from 'mongoose';

const SocialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, 'Please specify the social media platform'],
    enum: ['facebook', 'instagram', 'tiktok', 'twitter', 'youtube', 'pinterest', 'snapchat', 'linkedin', 'other'],
    lowercase: true
  },
  url: {
    type: String,
    required: [true, 'Please provide the social media URL'],
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  icon: {
    type: String,
    default: ''
  },
  displayName: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('SocialLink', SocialLinkSchema); 