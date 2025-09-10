const express = require('express');

const authenticateToken = require('../middleware/authMiddleware');
// import User from '../models/User';
const User = require('../models/User');
// import { GoogleGenerativeAI } from '@google/generative-ai';
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Daily Challenge Service Class
class DailyChallengeService {
  constructor() {
    this.genAI = genAI;
  }

  /**
   * Get or generate today's daily challenge for a user
   */
  async getTodaysDailyChallenge(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user already attempted today's challenge
      const todaysAttempt = user.streakData?.dailyChallengeHistory?.find(attempt => {
        const attemptDate = new Date(attempt.date);
        attemptDate.setHours(0, 0, 0, 0);
        return attemptDate.getTime() === today.getTime();
      });

      if (todaysAttempt) {
        return {
          success: true,
          alreadyAttempted: true,
          challenge: null,
          message: "You've already completed today's challenge!",
          streakInfo: {
            currentStreak: user.streakData?.currentStreak || 0,
            longestStreak: user.streakData?.longestStreak || 0,
            totalCompleted: user.streakData?.totalDailyChallengesCompleted || 0
          }
        };
      }

      // Generate new daily challenge
      const challenge = await this.generateDailyChallenge(user);
      
      return {
        success: true,
        alreadyAttempted: false,
        challenge,
        streakInfo: {
          currentStreak: user.streakData?.currentStreak || 0,
          longestStreak: user.streakData?.longestStreak || 0,
          totalCompleted: user.streakData?.totalDailyChallengesCompleted || 0
        }
      };

    } catch (error) {
      console.error('Error getting daily challenge:', error);
      throw error;
    }
  }

  /**
   * Generate a daily challenge based on user's profile
   */
  async generateDailyChallenge(user) {
    const userPreferences = this.extractUserPreferences(user);
    const today = new Date();
    
    // Create a deterministic seed based on date and user ID for consistency
    const dateString = today.toISOString().split('T')[0];
    const seed = `${dateString}-${user._id}`;
    
    const subjects = user.interests && user.interests.length > 0 ? user.interests : ['math'];
    const randomSubject = subjects[Math.abs(this.hashCode(seed + 'subject')) % subjects.length];
    
    const difficulties = ['easy', 'medium', 'hard'];
    const randomDifficulty = difficulties[Math.abs(this.hashCode(seed + 'difficulty')) % difficulties.length];

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Generate a single ${randomDifficulty} level ${randomSubject} question suitable for ${userPreferences.classLevel} grade students in ${userPreferences.location} area. 

Requirements:
- Create exactly ONE multiple choice question
- Make it relevant to rural/local context when possible
- Provide exactly 4 options (A, B, C, D)
- Clearly indicate the correct answer
- Make it appropriate for daily practice

Format your response as JSON:
{
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option A",
  "subject": "${randomSubject}",
  "difficulty": "${randomDifficulty}",
  "explanation": "Brief explanation of the correct answer",
  "pointsValue": 10-50 based on difficulty
}

Subject: ${randomSubject}
Difficulty: ${randomDifficulty}
Class Level: ${userPreferences.classLevel}
Location Context: ${userPreferences.location}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean and parse JSON
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const questionData = JSON.parse(text);

      // Validate the response
      if (!questionData.question || !questionData.options || !questionData.answer) {
        throw new Error('Invalid question format received from AI');
      }

      // Add metadata
      questionData.challengeId = seed;
      questionData.dateGenerated = new Date();
      questionData.classLevel = userPreferences.classLevel;

      return questionData;

    } catch (error) {
      console.error('Error generating daily challenge:', error);
      // Return fallback challenge
      return this.getFallbackDailyChallenge(randomSubject, randomDifficulty, userPreferences);
    }
  }

  /**
   * Submit daily challenge answer
   */
  async submitDailyChallenge(userId, challengeData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const { challengeId, userAnswer, timeSpent = 0 } = challengeData;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Initialize streakData if it doesn't exist
      if (!user.streakData) {
        user.streakData = {
          currentStreak: 0,
          longestStreak: 0,
          lastSubmissionDate: null,
          totalDailyChallengesCompleted: 0,
          dailyChallengeHistory: []
        };
      }

      // Check if already submitted today
      const todaysAttempt = user.streakData.dailyChallengeHistory.find(attempt => {
        const attemptDate = new Date(attempt.date);
        attemptDate.setHours(0, 0, 0, 0);
        return attemptDate.getTime() === today.getTime();
      });

      if (todaysAttempt) {
        return {
          success: false,
          message: "You've already completed today's challenge!"
        };
      }

      // Get the correct answer (regenerate challenge to compare)
      const challenge = await this.generateDailyChallenge(user);
      const isCorrect = userAnswer === challenge.answer;
      
      // Calculate points
      let pointsEarned = 0;
      if (isCorrect) {
        pointsEarned = challenge.pointsValue || 20;
        // Bonus points for completing within time limits
        if (timeSpent <= 60) pointsEarned += 10; // Speed bonus
      }

      // Add to history
      user.streakData.dailyChallengeHistory.push({
        date: new Date(),
        questionId: challengeId,
        subject: challenge.subject,
        difficulty: challenge.difficulty,
        isCorrect,
        timeSpent,
        pointsEarned
      });

      // Update streak
      this.updateUserStreak(user, isCorrect, pointsEarned);

      await user.save();

      return {
        success: true,
        isCorrect,
        correctAnswer: challenge.answer,
        explanation: challenge.explanation,
        pointsEarned,
        streakInfo: {
          currentStreak: user.streakData.currentStreak,
          longestStreak: user.streakData.longestStreak,
          totalCompleted: user.streakData.totalDailyChallengesCompleted,
          streakUpdated: true
        }
      };

    } catch (error) {
      console.error('Error submitting daily challenge:', error);
      throw error;
    }
  }

  /**
   * Get user's streak statistics
   */
  async getStreakStats(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize streakData if it doesn't exist
      if (!user.streakData) {
        user.streakData = {
          currentStreak: 0,
          longestStreak: 0,
          lastSubmissionDate: null,
          totalDailyChallengesCompleted: 0,
          dailyChallengeHistory: []
        };
        await user.save();
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if streak is still valid (not broken)
      const lastSubmission = user.streakData.lastSubmissionDate 
        ? new Date(user.streakData.lastSubmissionDate) 
        : null;

      let currentStreak = user.streakData.currentStreak;

      if (lastSubmission) {
        lastSubmission.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // If last submission was not yesterday or today, streak is broken
        if (lastSubmission.getTime() < yesterday.getTime()) {
          currentStreak = 0;
          user.streakData.currentStreak = 0;
          await user.save();
        }
      }

      // Get recent history (last 30 days)
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentHistory = user.streakData.dailyChallengeHistory
        .filter(attempt => new Date(attempt.date) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        success: true,
        streakData: {
          currentStreak,
          longestStreak: user.streakData.longestStreak,
          totalCompleted: user.streakData.totalDailyChallengesCompleted,
          canSubmitToday: !recentHistory.some(attempt => {
            const attemptDate = new Date(attempt.date);
            attemptDate.setHours(0, 0, 0, 0);
            return attemptDate.getTime() === today.getTime();
          }),
          recentHistory: recentHistory.slice(0, 7) // Last 7 days
        }
      };

    } catch (error) {
      console.error('Error getting streak stats:', error);
      throw error;
    }
  }

  // Helper methods
  updateUserStreak(user, isCorrect, pointsEarned) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastSubmission = user.streakData.lastSubmissionDate 
      ? new Date(user.streakData.lastSubmissionDate) 
      : null;
    
    if (lastSubmission) {
      lastSubmission.setHours(0, 0, 0, 0);
    }

    // Update last submission date
    user.streakData.lastSubmissionDate = new Date();
    user.streakData.totalDailyChallengesCompleted += 1;

    if (isCorrect) {
      // Check if streak should continue
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!lastSubmission || lastSubmission.getTime() === yesterday.getTime()) {
        // Continue or start streak
        user.streakData.currentStreak += 1;
      } else if (lastSubmission.getTime() < yesterday.getTime()) {
        // Streak broken, start new
        user.streakData.currentStreak = 1;
      }

      // Update longest streak
      if (user.streakData.currentStreak > user.streakData.longestStreak) {
        user.streakData.longestStreak = user.streakData.currentStreak;
      }

      // Add points
      user.points = (user.points || 0) + pointsEarned;
    }
  }

  extractUserPreferences(user) {
    return {
      subject: user.interests?.[0]?.toLowerCase() || 'math',
      classLevel: this.extractClassLevel(user.grade),
      difficulty: this.mapLevelToDifficulty(user.level || 1),
      location: user.location || 'rural'
    };
  }

  extractClassLevel(grade) {
    if (!grade) return '10';
    const match = grade.match(/(\d+)/);
    return match ? match[1] : '10';
  }

  mapLevelToDifficulty(level) {
    if (level <= 2) return 'easy';
    if (level <= 5) return 'medium';
    return 'hard';
  }

  // Simple hash function for deterministic randomness
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  getFallbackDailyChallenge(subject, difficulty, userPreferences) {
    const fallbacks = {
      math: {
        easy: {
          question: "If a farmer has 15 chickens and buys 8 more, how many chickens does he have in total?",
          options: ["20", "23", "25", "18"],
          answer: "23",
          explanation: "15 + 8 = 23 chickens in total."
        },
        medium: {
          question: "A rectangular field is 20m long and 15m wide. What is its area?",
          options: ["300 sq m", "350 sq m", "280 sq m", "320 sq m"],
          answer: "300 sq m",
          explanation: "Area = length × width = 20 × 15 = 300 square meters."
        }
      }
    };

    const fallback = fallbacks[subject]?.[difficulty] || fallbacks.math.easy;
    return {
      ...fallback,
      subject,
      difficulty,
      pointsValue: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35,
      challengeId: `fallback-${Date.now()}`,
      dateGenerated: new Date(),
      classLevel: userPreferences.classLevel
    };
  }
}

const dailyChallengeService = new DailyChallengeService();

// Routes
// Get today's daily challenge
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const result = await dailyChallengeService.getTodaysDailyChallenge(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting daily challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily challenge',
      error: error.message
    });
  }
});

// Submit daily challenge answer
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { challengeId, userAnswer, timeSpent } = req.body;
    
    if (!challengeId || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Challenge ID and user answer are required'
      });
    }

    const result = await dailyChallengeService.submitDailyChallenge(req.user.userId, {
      challengeId,
      userAnswer,
      timeSpent
    });

    res.json(result);
  } catch (error) {
    console.error('Error submitting daily challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit daily challenge',
      error: error.message
    });
  }
});

// Get user's streak statistics
router.get('/streak-stats', authenticateToken, async (req, res) => {
  try {
    const result = await dailyChallengeService.getStreakStats(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting streak stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get streak statistics',
      error: error.message
    });
  }
});

export default router;