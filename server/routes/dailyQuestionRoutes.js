const express = require('express');
const router = express.Router();
const dailyQuestionService = require('../services/dailyQuestionService');
const authenticateToken = require('../middleware/authMiddleware');
const DailyQuestion = require('../models/DailyQuestion');

// Get today's daily question

router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("first",userId)
    const result = await dailyQuestionService.getTodayQuestion(userId);
console.log(result);
    if (!result || !result.question) {
      return res.status(404).json({
        success: false,
        message: 'No daily question available for today. Please try again later.'
      });
    }

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting today\'s question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily question'
    });
  }
});


// Submit daily question answer
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and answer are required'
      });
    }

    const result = await dailyQuestionService.submitDailyAnswer(userId, questionId, answer);

    res.json({
      success: true,
      message: result.isCorrect ? 'Correct answer! 🎉' : 'Incorrect answer. Better luck tomorrow!',
      isCorrect: result.isCorrect,
      correctAnswer: result.correctAnswer,
      explanation: result.explanation
    });

  } catch (error) {
    console.error('Error submitting daily answer:', error);
    
    if (error.message === 'You have already submitted today\'s question') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit answer'
    });
  }
});

// Get user streak statistics
router.get('/streak', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await dailyQuestionService.getUserStreakStats(userId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting streak stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streak statistics'
    });
  }
});

// Generate daily questions manually (for testing)
router.post('/generate', async (req, res) => {
  try {
    await dailyQuestionService.generateDailyQuestions();
    
    res.json({
      success: true,
      message: 'Daily questions generated successfully'
    });

  } catch (error) {
    console.error('Error generating daily questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily questions'
    });
  }
});

// FIX DATABASE INDEX - Run this once to fix the schema
router.post('/fix-database', async (req, res) => {
  try {
    console.log('Fixing database indexes...');
    
    // Drop all existing indexes except _id
    await DailyQuestion.collection.dropIndexes();
    console.log('Dropped existing indexes');
    
    // Create the correct compound index
    await DailyQuestion.collection.createIndex({ date: 1, grade: 1 }, { unique: true });
    console.log('Created correct compound index');
    
    res.json({
      success: true,
      message: 'Database indexes fixed successfully'
    });

  } catch (error) {
    console.error('Error fixing database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix database'
    });
  }
});

module.exports = router;