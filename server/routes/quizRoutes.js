const express = require("express");
const quizService = require("../services/quizService");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Generate quiz for authenticated user
router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const quiz = await quizService.generateQuiz(userId);
    
    res.json({
      success: true,
      quiz,
      message: "Quiz generated successfully"
    });
  } catch (error) {
    console.error("Quiz generation route error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate quiz"
    });
  }
});

// Generate quiz with custom parameters (subject and difficulty only)
router.post("/generate-custom", authenticateToken, async (req, res) => {
  try {
    const { subject, difficulty } = req.body;
    const userId = req.user.userId;
    
    // Only require subject and difficulty - classLevel will be extracted from user model
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

    // Use the quiz service methods directly with custom preferences
    const prompt = quizService.buildQuizPrompt(customPreferences);
    const apiResponse = await quizService.callGeminiAPIWithRetry(prompt);
    const quiz = quizService.parseQuizResponse(apiResponse, customPreferences);
    
    res.json({
      success: true,
      quiz,
      message: "Custom quiz generated successfully"
    });
  } catch (error) {
    console.error("Custom quiz generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate custom quiz"
    });
  }
});

module.exports = router;