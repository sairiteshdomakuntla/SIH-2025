const mongoose = require('mongoose');

const dailyQuestionSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  answer: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  explanation: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// CORRECT compound index - unique combination of date AND grade
dailyQuestionSchema.index({ date: 1, grade: 1 }, { unique: true });

module.exports = mongoose.model('DailyQuestion', dailyQuestionSchema);