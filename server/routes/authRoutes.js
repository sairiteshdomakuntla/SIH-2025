const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, location, grade, interests } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      location,
      grade,
      interests: interests || []
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d"
    });

    const userData = { ...user._doc, password: undefined };

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userData
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d"
    });

    const userData = { ...user._doc, password: undefined };

    res.json({ message: "Login successful", token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify token
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json({ user });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, location, grade, interests, bio } = req.body;
    const userId = req.user.userId;

    // Check if email is being changed and if it's already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use by another account" });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: Date.now()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (location) updateData.location = location;
    if (grade) updateData.grade = grade;
    if (interests) updateData.interests = interests;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      message: "Profile updated successfully", 
      user 
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Update user stats (for quiz completion, etc.)
router.put("/stats", authenticateToken, async (req, res) => {
  try {
    const { 
      points, 
      level, 
      achievements, 
      completedQuizzes, 
      quizScore,
      completedCourses 
    } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update stats
    if (points !== undefined) user.points += points;
    if (level !== undefined) user.level = level;
    if (achievements !== undefined) user.achievements += achievements;
    if (completedQuizzes !== undefined) user.completedQuizzes += completedQuizzes;
    if (completedCourses !== undefined) user.completedCourses += completedCourses;
    
    // Update average score if a new quiz score is provided
    if (quizScore !== undefined) {
      user.totalScore += quizScore;
      user.averageScore = Math.round(user.totalScore / user.completedQuizzes);
    }

    user.updatedAt = Date.now();
    await user.save();

    const updatedUser = await User.findById(userId).select("-password");
    res.json({ 
      message: "Stats updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Update stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user leaderboard data
router.get("/leaderboard", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("name level points achievements completedQuizzes averageScore location")
      .sort({ points: -1, level: -1 })
      .limit(limit)
      .skip(skip);

    const totalUsers = await User.countDocuments();
    const currentUser = await User.findById(req.user.userId)
      .select("name level points achievements completedQuizzes averageScore location");

    // Find current user's rank
    const usersAbove = await User.countDocuments({ 
      $or: [
        { points: { $gt: currentUser.points } },
        { 
          points: currentUser.points, 
          level: { $gt: currentUser.level } 
        }
      ]
    });
    const currentUserRank = usersAbove + 1;

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit
      },
      currentUser: {
        ...currentUser.toObject(),
        rank: currentUserRank
      }
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
