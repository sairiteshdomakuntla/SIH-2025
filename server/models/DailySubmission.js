const mongoose = require('mongoose');

const dailySubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyQuestion',
    required: true
  },
  userAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one submission per user per day
dailySubmissionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailySubmission', dailySubmissionSchema);