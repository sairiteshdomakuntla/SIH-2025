const mongoose = require('mongoose');

const quizRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  hostName: {
    type: String,
    required: true,
    trim: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    socketId: String, // Add socket ID tracking
    isHost: {
      type: Boolean,
      default: false
    },
    joined: {
      type: Date,
      default: Date.now
    },
    isConnected: {
      type: Boolean,
      default: true
    },
    score: {
      type: Number,
      default: 0
    },
    answers: [{
      questionIndex: Number,
      answer: String,
      isCorrect: Boolean,
      timeTaken: Number
    }],
    finished: {
      type: Boolean,
      default: false
    }
  }],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      answer: String,
      questionNumber: Number
    }],
    subject: String,
    difficulty: String
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  startedAt: Date,
  finishedAt: Date,
  maxParticipants: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuizRoom', quizRoomSchema);