const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: mongoose.Schema.Types.Mixed, // Store Editor.js blocks
    default: { blocks: [], version: "2.28.2" }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  subject: {
    type: String,
    enum: ['Math', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Art', 'Music', 'General'],
    default: 'General'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, subject: 1 });
noteSchema.index({ userId: 1, tags: 1 });
noteSchema.index({ title: 'text', tags: 'text' });

// Update lastModified on save
noteSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

module.exports = mongoose.model('Note', noteSchema);