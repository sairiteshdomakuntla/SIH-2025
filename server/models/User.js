const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  grade: { type: String, required: true },
  interests: [String],
  bio: { type: String, default: '' },
  level: { type: Number, default: 1 },
  points: { type: Number, default: 0 },
  achievements: { type: Number, default: 0 },
  completedCourses: { type: Number, default: 0 },
  completedQuizzes: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);
