const express = require("express");
const quizService = require("../services/quizService");
const authenticateToken = require("../middleware/authMiddleware");

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

module.exports = router;