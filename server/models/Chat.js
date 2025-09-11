const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous usage
  },
  sessionId: {
    type: String,
    required: true // To group messages in a conversation
  },
  messages: [{
    type: {
      type: String,
      enum: ['user', 'bot-text', 'bot-animation'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    prompt: String, // For animation messages
    video_url: String, // For animation messages
    relatedSimulations: [{
      title: String,
      subject: String,
      category: String,
      description: String,
      iframeUrl: String
    }], // For text messages with related simulations
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
chatSchema.index({ userId: 1, updatedAt: -1 });
chatSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Chat', chatSchema);
