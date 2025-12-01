import mongoose from 'mongoose';

const InstagramImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL']
  },
  caption: {
    type: String,
    default: ''
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  link: {
    type: String,
    default: '#'
  },
  isActive: {
    type: Boolean,
    default: true
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

export default mongoose.model('InstagramImage', InstagramImageSchema); 