const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const DailyChallenge = require('../models/DailyChallenge');

const router = express.Router();

class DailyChallengeService {
  /**
   * Get today's daily challenge for a user based on their grade
   */
  async getTodaysDailyChallenge(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

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
        await user.save();
      }

      // Check if user already attempted today's challenge
      const todaysAttempt = user.streakData.dailyChallengeHistory.find(attempt => {
        const attemptDate = new Date(attempt.date);
        attemptDate.setHours(0, 0, 0, 0);
        return attemptDate.getTime() === today.getTime();
      });

      // Get today's challenge from database
      const dailyChallenge = await DailyChallenge.findOne({ date: today });
      
      if (!dailyChallenge) {
        return {
          success: false,
          message: "Today's challenge is not ready yet. Please check back later!"
        };
      }

      // Get challenge for user's grade
      const userGrade = user.grade; // e.g., "5th", "6th", etc.
      const challenge = dailyChallenge.challenges[userGrade];

      if (!challenge) {
        return {
          success: false,
          message: `Challenge not available for your grade (${userGrade}). Please contact support.`
        };
      }

      if (todaysAttempt) {
        // ✅ NEW: Return challenge WITH answer for review after submission
        return {
          success: true,
          alreadyAttempted: true,
          challenge: {
            ...challenge, // Include the answer for review
            challengeId: `${today.toISOString().split('T')[0]}-${userGrade}`,
            dateGenerated: today
          },
          submissionResult: {
            isCorrect: todaysAttempt.isCorrect,
            userAnswer: todaysAttempt.userAnswer,
            pointsEarned: todaysAttempt.pointsEarned,
            timeSpent: todaysAttempt.timeSpent
          },
          message: "You've completed today's challenge! Here's your review:",
          streakInfo: {
            currentStreak: user.streakData.currentStreak,
            longestStreak: user.streakData.longestStreak,
            totalCompleted: user.streakData.totalDailyChallengesCompleted
          }
        };
      }

      // Return challenge without the answer for new attempts
      const { answer, ...challengeWithoutAnswer } = challenge;
      
      return {
        success: true,
        alreadyAttempted: false,
        challenge: {
          ...challengeWithoutAnswer,
          challengeId: `${today.toISOString().split('T')[0]}-${userGrade}`,
          dateGenerated: today
        },
        streakInfo: {
          currentStreak: user.streakData.currentStreak,
          longestStreak: user.streakData.longestStreak,
          totalCompleted: user.streakData.totalDailyChallengesCompleted
        }
      };

    } catch (error) {
      console.error('Error getting daily challenge:', error);
      throw error;
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

      // Get today's challenge from database
      const dailyChallenge = await DailyChallenge.findOne({ date: today });
      
      if (!dailyChallenge) {
        return {
          success: false,
          message: "Challenge not found for today"
        };
      }

      // Get challenge for user's grade
      const userGrade = user.grade;
      const challenge = dailyChallenge.challenges[userGrade];

      if (!challenge) {
        return {
          success: false,
          message: `Challenge not available for your grade (${userGrade})`
        };
      }

      const isCorrect = userAnswer === challenge.answer;
      
      // Calculate points
      let pointsEarned = 0;
      if (isCorrect) {
        pointsEarned = challenge.pointsValue || 20;
        // Bonus points for completing within time limits
        if (timeSpent <= 60) pointsEarned += 10; // Speed bonus
      }

      // Add to history - ✅ Store user's answer for review
      user.streakData.dailyChallengeHistory.push({
        date: new Date(),
        questionId: challengeId,
        subject: challenge.subject,
        difficulty: challenge.difficulty,
        isCorrect,
        timeSpent,
        pointsEarned,
        userAnswer: userAnswer // Store user's answer for review
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
        userAnswer: userAnswer,
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

      const lastSubmission = user.streakData.lastSubmissionDate 
        ? new Date(user.streakData.lastSubmissionDate) 
        : null;

      let currentStreak = user.streakData.currentStreak;

      if (lastSubmission) {
        lastSubmission.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastSubmission.getTime() < yesterday.getTime()) {
          currentStreak = 0;
          user.streakData.currentStreak = 0;
          await user.save();
        }
      }

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
          recentHistory: recentHistory.slice(0, 7)
        }
      };

    } catch (error) {
      console.error('Error getting streak stats:', error);
      throw error;
    }
  }

  // Helper method
  updateUserStreak(user, isCorrect, pointsEarned) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastSubmission = user.streakData.lastSubmissionDate 
      ? new Date(user.streakData.lastSubmissionDate) 
      : null;
    
    if (lastSubmission) {
      lastSubmission.setHours(0, 0, 0, 0);
    }

    user.streakData.lastSubmissionDate = new Date();
    user.streakData.totalDailyChallengesCompleted += 1;

    if (isCorrect) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!lastSubmission || lastSubmission.getTime() === yesterday.getTime()) {
        user.streakData.currentStreak += 1;
      } else if (lastSubmission.getTime() < yesterday.getTime()) {
        user.streakData.currentStreak = 1;
      }

      if (user.streakData.currentStreak > user.streakData.longestStreak) {
        user.streakData.longestStreak = user.streakData.currentStreak;
      }

      user.points = (user.points || 0) + pointsEarned;
    }
  }
}

const dailyChallengeService = new DailyChallengeService();

// Routes
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

module.exports = router;