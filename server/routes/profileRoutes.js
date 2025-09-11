const express = require("express");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");
const multer = require("multer");
const supabase = require("../config/supabase");
const badgeService = require('../services/badgeService');

const router = express.Router();

// Configure multer for memory storage (for Supabase upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload avatar
router.post("/avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.userId;
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error("Supabase upload error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        message: "Failed to upload image", 
        error: error.message || "Unknown upload error"
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // Update user avatar in database
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: publicUrl, updatedAt: Date.now() },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Avatar uploaded successfully",
      avatarUrl: publicUrl,
      user
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete avatar
router.delete("/avatar", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from Supabase if avatar exists
    if (user.avatar && user.avatar.includes('supabase')) {
      // Extract file path from URL
      const urlParts = user.avatar.split('/');
      const filePath = `avatars/${urlParts[urlParts.length - 1]}`;
      
      await supabase.storage
        .from('images')
        .remove([filePath]);
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: '', updatedAt: Date.now() },
      { new: true }
    ).select("-password");

    res.json({
      message: "Avatar removed successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Avatar deletion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user achievements
router.get("/achievements", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Define achievement criteria
    const achievements = [
      {
        id: 'first_quiz',
        name: 'First Steps',
        description: 'Complete your first quiz',
        icon: 'target',
        unlocked: user.completedQuizzes >= 1,
        requirement: 1,
        current: user.completedQuizzes
      },
      {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: 'trophy',
        unlocked: user.completedQuizzes >= 10,
        requirement: 10,
        current: user.completedQuizzes
      },
      {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 1000 points',
        icon: 'star',
        unlocked: user.points >= 1000,
        requirement: 1000,
        current: user.points
      },
      {
        id: 'level_up',
        name: 'Level Up',
        description: 'Reach level 5',
        icon: 'crown',
        unlocked: user.level >= 5,
        requirement: 5,
        current: user.level
      },
      {
        id: 'perfect_score',
        name: 'Perfectionist',
        description: 'Maintain 90% average score',
        icon: 'zap',
        unlocked: user.averageScore >= 90,
        requirement: 90,
        current: user.averageScore
      },
      {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Complete 50 quizzes',
        icon: 'shield',
        unlocked: user.completedQuizzes >= 50,
        requirement: 50,
        current: user.completedQuizzes
      }
    ];

    const unlockedCount = achievements.filter(achievement => achievement.unlocked).length;

    res.json({
      achievements,
      totalAchievements: achievements.length,
      unlockedAchievements: unlockedCount,
      user: {
        level: user.level,
        points: user.points,
        completedQuizzes: user.completedQuizzes,
        averageScore: user.averageScore
      }
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user dashboard data
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate progress to next level (assuming 100 points per level)
    const pointsPerLevel = 100;
    const currentLevelPoints = (user.level - 1) * pointsPerLevel;
    const nextLevelPoints = user.level * pointsPerLevel;
    const progressToNextLevel = Math.max(0, Math.min(100, 
      ((user.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
    ));

    // Get recent activity (this would typically come from a separate activities collection)
    const recentActivity = [
      {
        id: 1,
        type: 'quiz_completed',
        title: 'Completed Math Quiz',
        description: 'Scored 85% on Basic Algebra',
        points: 15,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 2,
        type: 'achievement_unlocked',
        title: 'New Achievement!',
        description: 'Unlocked "First Steps" achievement',
        points: 10,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    // Calculate weekly progress (mock data - would be from actual user activity)
    const weeklyProgress = {
      quizzesCompleted: Math.min(user.completedQuizzes, 7),
      pointsEarned: Math.min(user.points, 150),
      hoursStudied: Math.floor(user.completedQuizzes * 0.5), // Assuming 30 mins per quiz
      streak: user.streak || 0
    };

    res.json({
      user,
      progress: {
        level: user.level,
        points: user.points,
        progressToNextLevel: Math.round(progressToNextLevel),
        nextLevelPoints: nextLevelPoints
      },
      stats: {
        totalQuizzes: user.completedQuizzes,
        averageScore: user.averageScore,
        totalAchievements: user.achievements,
        currentStreak: user.streak
      },
      weeklyProgress,
      recentActivity
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user badges
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching badges for user:', req.user.userId);
    const badges = await badgeService.getBadgesWithProgress(req.user.userId);
    res.json({ success: true, badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
