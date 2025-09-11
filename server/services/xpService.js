const User = require('../models/User');
const badgeService = require('./badgeService');

class XPService {
  constructor() {
    // XP rewards system based on the reference image
    this.xpRewards = {
      // Daily Challenge System
      'daily_challenge_correct': 100,    // Main streak driver
      'daily_challenge_wrong': 30,       // Still reward effort so they don't skip
      
      // Streak Bonuses (bonus XP on top of daily XP)
      'maintaining_streak_7': 100,       // 7-day streak bonus
      'maintaining_streak_30': 500,      // 30-day streak bonus  
      'maintaining_streak_100': 2000,    // 100-day streak bonus
      
      // Interactive Learning
      'simulation_completed': 40,        // Active learning
      
      // Quiz System
      'quiz_set_completed': 30,          // Base quiz completion
      'quiz_bonus_80_percent': 10,       // +10 bonus if ≥80% correct
      
      // Notes and Reflections
      'note_written': 15,                // Cap: 3 notes/day → max 45 XP
      
      // Community Participation  
      'community_help_upvote': 5,        // Per upvote (max 25/day)
      
      // Weekly Competitions
      'leaderboard_1st': 200,            // 1st place weekly
      'leaderboard_2nd': 150,            // 2nd place weekly
      'leaderboard_3rd': 100,            // 3rd place weekly
      
      // Participation XP (from socket events)
      'chat_message': 2,                 // Chat participation
      'join_room': 1,                    // Room joining
      'helpful_message': 5               // Helpful community message
    };

    // Level thresholds based on reference image
    this.levelThresholds = [
      { level: 1, minXP: 0, maxXP: 100, unlock: 'Starter badge' },
      { level: 2, minXP: 101, maxXP: 300, unlock: 'Profile customization' },
      { level: 3, minXP: 301, maxXP: 600, unlock: 'Bronze Badge' },
      { level: 4, minXP: 601, maxXP: 1000, unlock: 'Access to advanced quizzes' },
      { level: 5, minXP: 1001, maxXP: 1500, unlock: 'Silver Badge' },
      { level: 6, minXP: 1501, maxXP: 2200, unlock: 'Unlock new simulations' },
      { level: 7, minXP: 2201, maxXP: 3000, unlock: 'Gold Badge' },
      { level: 8, minXP: 3001, maxXP: 4000, unlock: 'Mentor role' },
      { level: 9, minXP: 4001, maxXP: 5500, unlock: 'Platinum Badge + certificate' },
      { level: 10, minXP: 5501, maxXP: 999999, unlock: 'Master status + special privileges' }
    ];
  }

  /**
   * Calculate user level based on XP
   * @param {number} xp - Current XP
   * @returns {object} Level information
   */
  calculateLevel(xp) {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      const threshold = this.levelThresholds[i];
      if (xp >= threshold.minXP) {
        const nextThreshold = this.levelThresholds[i + 1];
        return {
          level: threshold.level,
          currentXP: xp,
          minXP: threshold.minXP,
          maxXP: threshold.maxXP,
          xpToNext: nextThreshold ? nextThreshold.minXP - xp : 0,
          unlock: threshold.unlock,
          nextUnlock: nextThreshold?.unlock || null,
          progress: threshold.maxXP !== 999999 ? 
            Math.round(((xp - threshold.minXP) / (threshold.maxXP - threshold.minXP)) * 100) : 100
        };
      }
    }
    return this.levelThresholds[0]; // Default to level 1
  }

  /**
   * Award XP to user and handle level ups
   * @param {string} userId - User ID
   * @param {string} action - Action that triggered XP
   * @param {object} options - Additional options (multiplier, etc.)
   * @returns {object} XP award result
   */
  async awardXP(userId, action, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const baseXP = this.xpRewards[action] || 0;
      if (baseXP === 0) {
        return { success: false, message: 'Invalid action' };
      }

      // Apply multipliers or caps
      let finalXP = baseXP;
      
      // Handle daily caps
      if (action === 'note_written') {
        const today = new Date().toISOString().split('T')[0];
        const todayNotes = await this.getUserDailyNoteCount(userId, today);
        if (todayNotes >= 3) {
          return { success: false, message: 'Daily note limit reached' };
        }
      }
      
      if (action === 'community_help_upvote') {
        const today = new Date().toISOString().split('T')[0];
        const todayUpvotes = await this.getUserDailyUpvoteCount(userId, today);
        if (todayUpvotes >= 5) { // Max 5 upvotes per day = 25 XP
          return { success: false, message: 'Daily upvote limit reached' };
        }
      }

      // Calculate old level
      const oldLevelInfo = this.calculateLevel(user.points || 0);
      
      // Award XP
      user.points = (user.points || 0) + finalXP;
      user.totalXP = (user.totalXP || 0) + finalXP;
      user.weeklyXP = (user.weeklyXP || 0) + finalXP;
      
      // Calculate new level
      const newLevelInfo = this.calculateLevel(user.points);
      
      const leveledUp = newLevelInfo.level > oldLevelInfo.level;
      
      if (leveledUp) {
        user.level = newLevelInfo.level;
        
        // Award achievements for level up
        user.achievements = (user.achievements || 0) + 1;
        
        // Add level-based badges
        await this.awardLevelBadges(userId, newLevelInfo.level);
      }

      await user.save();

      // Check for new badges
      const newBadges = await badgeService.checkAndAwardBadges(userId);

      return {
        success: true,
        xpAwarded: finalXP,
        action,
        oldLevel: oldLevelInfo.level,
        newLevel: newLevelInfo.level,
        leveledUp,
        totalXP: user.points,
        levelInfo: newLevelInfo,
        newBadges: newBadges || [],
        unlocks: leveledUp ? [newLevelInfo.unlock] : []
      };

    } catch (error) {
      console.error('Error awarding XP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Award streak bonus XP
   * @param {string} userId - User ID  
   * @param {number} streakLength - Current streak length
   * @returns {object} Result
   */
  async awardStreakBonus(userId, streakLength) {
    try {
      let bonusAction = null;
      
      if (streakLength === 7) {
        bonusAction = 'maintaining_streak_7';
      } else if (streakLength === 30) {
        bonusAction = 'maintaining_streak_30';
      } else if (streakLength === 100) {
        bonusAction = 'maintaining_streak_100';
      }
      
      if (bonusAction) {
        return await this.awardXP(userId, bonusAction);
      }
      
      return { success: false, message: 'No streak bonus available' };
    } catch (error) {
      console.error('Error awarding streak bonus:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Award quiz completion XP with bonus
   * @param {string} userId - User ID
   * @param {number} score - Quiz score percentage
   * @param {number} totalQuestions - Total questions in quiz
   * @returns {object} Result
   */
  async awardQuizXP(userId, score, totalQuestions) {
    try {
      // Base quiz XP
      let result = await this.awardXP(userId, 'quiz_set_completed');
      
      // Bonus for high performance
      if (score >= 80) {
        const bonusResult = await this.awardXP(userId, 'quiz_bonus_80_percent');
        if (bonusResult.success) {
          result.xpAwarded += bonusResult.xpAwarded;
          result.bonusAwarded = bonusResult.xpAwarded;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error awarding quiz XP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Award daily challenge XP
   * @param {string} userId - User ID
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {number} streakLength - Current streak length
   * @returns {object} Result
   */
  async awardDailyChallengeXP(userId, isCorrect, streakLength) {
    try {
      // Base daily challenge XP
      const action = isCorrect ? 'daily_challenge_correct' : 'daily_challenge_wrong';
      let result = await this.awardXP(userId, action);
      
      // Award streak bonuses at milestones
      if (isCorrect && streakLength > 0) {
        const streakResult = await this.awardStreakBonus(userId, streakLength);
        if (streakResult.success) {
          result.xpAwarded += streakResult.xpAwarded;
          result.streakBonusAwarded = streakResult.xpAwarded;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error awarding daily challenge XP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Award weekly leaderboard XP
   * @param {string} userId - User ID
   * @param {number} position - Position (1, 2, or 3)
   * @returns {object} Result
   */
  async awardLeaderboardXP(userId, position) {
    const actions = {
      1: 'leaderboard_1st',
      2: 'leaderboard_2nd', 
      3: 'leaderboard_3rd'
    };
    
    const action = actions[position];
    if (!action) {
      return { success: false, message: 'Invalid leaderboard position' };
    }
    
    return await this.awardXP(userId, action);
  }

  /**
   * Get user's XP and level information
   * @param {string} userId - User ID
   * @returns {object} User XP info
   */
  async getUserXPInfo(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const levelInfo = this.calculateLevel(user.points || 0);
      
      return {
        user: {
          id: user._id,
          name: user.name,
          avatar: user.avatar
        },
        ...levelInfo,
        badges: user.badges || [],
        achievements: user.achievements || 0,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0
      };
    } catch (error) {
      console.error('Error getting user XP info:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard for weekly competition
   * @param {number} limit - Number of users to return
   * @returns {Array} Top users by XP
   */
  async getWeeklyLeaderboard(limit = 10) {
    try {
      const users = await User.find({})
        .select('name points level avatar badges currentStreak')
        .sort({ points: -1 })
        .limit(limit);

      return users.map((user, index) => ({
        position: index + 1,
        user: {
          id: user._id,
          name: user.name,
          avatar: user.avatar
        },
        xp: user.points || 0,
        level: user.level || 1,
        streak: user.currentStreak || 0,
        badgeCount: (user.badges || []).length
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Helper method to award level-based badges
   */
  async awardLevelBadges(userId, level) {
    // This will be handled by badgeService.checkAndAwardBadges
    // but we can add special level milestone badges here if needed
  }

  /**
   * Helper method to get daily note count
   */
  async getUserDailyNoteCount(userId, date) {
    try {
      const Note = require('../models/Note');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const count = await Note.countDocuments({
        userId: userId,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      return count;
    } catch (error) {
      console.error('Error getting daily note count:', error);
      return 0;
    }
  }

  /**
   * Helper method to get daily upvote count  
   */
  async getUserDailyUpvoteCount(userId, date) {
    // This would require tracking upvote dates
    // For now, return 0 - implement based on your community model
    return 0;
  }

  /**
   * Get all XP actions and their rewards
   * @returns {object} XP rewards configuration
   */
  getXPRewards() {
    return this.xpRewards;
  }

  /**
   * Get level thresholds
   * @returns {Array} Level configuration
   */
  getLevelThresholds() {
    return this.levelThresholds;
  }
}

module.exports = new XPService();