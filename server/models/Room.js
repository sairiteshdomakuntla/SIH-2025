const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Player subdocument schema
const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  car: {
    type: String,
    default: 'default'
  },
  ready: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  finalScore: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  hasFinished: {
    type: Boolean,
    default: false
  },
  finishedAt: {
    type: Date
  },
  answers: [{
    type: mongoose.Schema.Types.Mixed
  }]
}, { _id: true });

// Room schema
const roomSchema = new mongoose.Schema({
  // For community chat rooms
  roomId: {
    type: String,
    unique: true,
    sparse: true  // Allows multiple null values
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxUsers: {
    type: Number,
    default: 50
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activeUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // For quiz game rooms
  roomCode: {
    type: String,
    unique: true,
    sparse: true  // Allows multiple null values
  },
  code: {
    type: String,
    unique: true,
    sparse: true  // Alternative field name for compatibility
  },
  capacity: {
    type: Number,
    default: 2
  },
  status: {
    type: String,
    enum: ['waiting', 'ready', 'active', 'completed'],
    default: 'waiting'
  },
  players: [playerSchema],
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  quizId: {
    type: String  // Changed from ObjectId to String for now
  },
  subject: {
    type: String
  },
  difficulty: {
    type: String
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  quizStartedAt: {
    type: Date
  },
  quizEndedAt: {
    type: Date
  },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String
  }]
}, {
  timestamps: true
});

// Pre-save hook to ensure proper IDs are generated
roomSchema.pre('save', function(next) {
  // For quiz rooms - generate roomCode if missing
  if (!this.roomCode && !this.roomId) {
    this.roomCode = uuidv4();
  }
  if (!this.code && this.roomCode) {
    this.code = this.roomCode; // Use same code for both fields
  }
  next();
});

// Index for efficient querying
roomSchema.index({ roomId: 1 });  // For community rooms
roomSchema.index({ roomCode: 1 }); // For quiz rooms
roomSchema.index({ status: 1 });
roomSchema.index({ subject: 1 });
roomSchema.index({ subject: 1, isPrivate: 1 }); // For community room filtering

module.exports = mongoose.model('Room', roomSchema);