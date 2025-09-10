const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  challenges: {
    // Questions organized by grade level
    "5th": {
      question: String,
      options: [String],
      answer: String,
      explanation: String,
      subject: String,
      difficulty: String,
      pointsValue: Number
    },
    "6th": {
      question: String,
      options: [String],
      answer: String,
      explanation: String,
      subject: String,
      difficulty: String,
      pointsValue: Number
    },
    "7th": {
      question: String,
      options: [String],
      answer: String,
      explanation: String,
      subject: String,
      difficulty: String,
      pointsValue: Number
    },
    "8th": {
      question: String,
      options: [String],
      answer: String,
      explanation: String,
      subject: String,
      difficulty: String,
      pointsValue: Number
    },
    "9th": {
      question: String,
      options: [String],
      answer: String,
      explanation: String,
      subject: String,
      difficulty: String,
      pointsValue: Number
    },
    "10th": {
      question: String,
      options: [String],
      answer: String,
      explanation: String,
      subject: String,
      difficulty: String,
      pointsValue: Number
    }
  }
}, {
  timestamps: true
});

// Index for efficient date queries
dailyChallengeSchema.index({ date: 1 });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);