const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  grade: { type: String, required: true },
  interests: [String],
  level: { type: Number, default: 1 },
  points: { type: Number, default: 0 },
  achievements: { type: Number, default: 0 },
  completedCourses: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
