const mongoose = require('mongoose');

const animationSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  promptHash: {
    type: String,
    required: true,
    index: true // For faster lookups
  },
  video_url: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: 'Video generated and uploaded successfully'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous usage for now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 1
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
animationSchema.index({ promptHash: 1, userId: 1 });
animationSchema.index({ userId: 1, createdAt: -1 }); // For user history

module.exports = mongoose.model('Animation', animationSchema);
