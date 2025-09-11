const express = require("express");
const quizService = require("../services/quizService");
const authenticateToken = require("../middleware/authMiddleware");
const badgeService = require('../services/badgeService');
const xpService = require('../services/xpService');

const router = express.Router();

// Generate quiz route - now generates multiple questions in one call
router.post("/generate", authenticateToken, async (req, res) => {
  try {
   const userId = req.user.userId;
    const User = require("../models/User");

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Extract user preferences
    const userPreferences = quizService.extractUserPreferences(user);

    // Generate multiple questions in one call
    const questions = await quizService.generateMultipleQuestions(userPreferences, 10);
    
    res.json({
      success: true,
      questions,
      message: "Quiz generated successfully"
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate quiz",
      error: error.message
    });
  }
});

// Generate custom quiz route - now generates multiple questions in one call
router.post("/generate-custom", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Custom quiz request body:", userId);
    const { subject, difficulty, questionCount = 10 } = req.body;

    if (!subject || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "Subject and difficulty are required"
      });
    }

    // Get user from database to extract class level and other preferences
    const User = require("../models/User");
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Extract user preferences and override with custom subject/difficulty
    const userPreferences = quizService.extractUserPreferences(user);
    const customPreferences = {
      ...userPreferences,
      subject: subject.toLowerCase(),
      difficulty: difficulty.toLowerCase()
    };

    // Generate multiple questions in one call
    const questions = await quizService.generateMultipleQuestions(customPreferences, questionCount);
    
    res.json({
      success: true,
      questions,
      message: "Custom quiz generated successfully"
    });
  } catch (error) {
    console.error("Custom quiz generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate custom quiz",
      error: error.message
    });
  }
});

// Submit quiz route (update existing)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { answers, quizId } = req.body;

    // Validate request
    if (!Array.isArray(answers) || !quizId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data"
      });
    }

    // Calculate results
    const correctAnswers = await quizService.calculateQuizResults(quizId, answers);
    const totalQuestions = answers.length;
    
    // Update user stats
    const user = await User.findById(req.user.id);
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const timeTaken = req.body.timeTaken || 0;
    
    // Update quiz-related stats
    user.completedQuizzes = (user.completedQuizzes || 0) + 1;
    user.highestScore = Math.max(user.highestScore || 0, score);
    
    // Update fastest time (only if quiz completed successfully)
    if (score > 0 && timeTaken > 0) {
      user.fastestTime = user.fastestTime ? 
        Math.min(user.fastestTime, timeTaken) : timeTaken;
    }
    
    // Update quiz streak
    if (score >= 60) { // Pass threshold
      user.quizStreak = (user.quizStreak || 0) + 1;
    } else {
      user.quizStreak = 0;
    }
    
    // Add to quiz history
    if (!user.quizHistory) user.quizHistory = [];
    user.quizHistory.push({
      subject: req.body.subject || 'general',
      score,
      completedAt: new Date(),
      timeTaken
    });
    
    // Recalculate average score
    const totalScore = user.quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
    user.averageScore = Math.round(totalScore / user.quizHistory.length);
    
    await user.save();

    // Award XP using new XP service
    const xpResult = await xpService.awardQuizXP(req.user.id, score, totalQuestions);
    
    // Check and award badges
    const newBadges = await badgeService.checkAndAwardBadges(req.user.id);
    
    res.json({
      success: true,
      results,
      score,
      correctAnswers,
      totalQuestions,
      xpAwarded: xpResult.xpAwarded || 0,
      levelInfo: xpResult.levelInfo,
      leveledUp: xpResult.leveledUp || false,
      newBadges: newBadges || []
    });
  } catch (error) {
    console.error("Quiz submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit quiz",
      error: error.message
    });
  }
});

module.exports = router;