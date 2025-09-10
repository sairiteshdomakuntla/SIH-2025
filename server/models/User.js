const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['5th', '6th', '7th', '8th', '9th', '10th']
  },
  interests: [{
    type: String,
    required: true
  }],
  level: {
    type: Number,
    default: 1
  },
  points: {
    type: Number,
    default: 0
  },
  achievements: {
    type: Number,
    default: 0
  },
  completedCourses: {
    type: Number,
    default: 0
  },
  streakData: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastSubmissionDate: {
      type: Date,
      default: null
    },
    totalDailyChallengesCompleted: {
      type: Number,
      default: 0
    },
    dailyChallengeHistory: [{
      date: {
        type: Date,
        required: true
      },
      questionId: {
        type: String,
        required: true
      },
      subject: {
        type: String,
        required: true
      },
      difficulty: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true
      },
      timeSpent: {
        type: Number,
        default: 0
      },
      pointsEarned: {
        type: Number,
        default: 0
      },
      userAnswer: {  // ✅ Added user's answer for review
        type: String,
        required: true
      }
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update streak
userSchema.methods.updateStreak = function(isCorrect, pointsEarned = 0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastSubmission = this.streakData.lastSubmissionDate 
    ? new Date(this.streakData.lastSubmissionDate) 
    : null;
  
  if (lastSubmission) {
    lastSubmission.setHours(0, 0, 0, 0);
  }

  // Check if already submitted today
  if (lastSubmission && lastSubmission.getTime() === today.getTime()) {
    return false; // Already submitted today
  }

  // Update last submission date
  this.streakData.lastSubmissionDate = new Date();
  this.streakData.totalDailyChallengesCompleted += 1;

  if (isCorrect) {
    // Check if streak should continue
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastSubmission || lastSubmission.getTime() === yesterday.getTime()) {
      // Continue or start streak
      this.streakData.currentStreak += 1;
    } else if (lastSubmission.getTime() < yesterday.getTime()) {
      // Streak broken, start new
      this.streakData.currentStreak = 1;
    }

    // Update longest streak
    if (this.streakData.currentStreak > this.streakData.longestStreak) {
      this.streakData.longestStreak = this.streakData.currentStreak;
    }

    // Add points
    this.points += pointsEarned;
  }

  return true; // Successfully updated
};

module.exports = mongoose.model('User', userSchema);
