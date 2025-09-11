const User = require('../models/User');

class BadgeService {
  constructor() {
    this.badgeDefinitions = {
      // Quiz-based badges
      first_quiz: {
        id: 'first_quiz',
        name: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🚀',
        color: 'blue',
        requirement: 1,
        category: 'quiz'
      },
      quiz_streak_3: {
        id: 'quiz_streak_3',
        name: 'Getting Started',
        description: 'Complete 3 quizzes in a row',
        icon: '🔥',
        color: 'orange',
        requirement: 3,
        category: 'streak'
      },
      quiz_streak_7: {
        id: 'quiz_streak_7',
        name: 'Weekly Warrior',
        description: 'Complete 7 quizzes in a row',
        icon: '⚡',
        color: 'yellow',
        requirement: 7,
        category: 'streak'
      },
      quiz_streak_15: {
        id: 'quiz_streak_15',
        name: 'Unstoppable',
        description: 'Complete 15 quizzes in a row',
        icon: '🏆',
        color: 'gold',
        requirement: 15,
        category: 'streak'
      },
      quiz_master: {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Complete 50 quizzes',
        icon: '👑',
        color: 'purple',
        requirement: 50,
        category: 'quiz'
      },
      perfect_score: {
        id: 'perfect_score',
        name: 'Perfectionist',
        description: 'Score 100% on a quiz',
        icon: '⭐',
        color: 'green',
        requirement: 100,
        category: 'score'
      },
      high_scorer: {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Maintain 90% average score',
        icon: '🎯',
        color: 'green',
        requirement: 90,
        category: 'average'
      },
      speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a quiz in under 5 minutes',
        icon: '💨',
        color: 'cyan',
        requirement: 300,
        category: 'speed'
      },
      daily_challenger: {
        id: 'daily_challenger',
        name: 'Daily Challenger',
        description: 'Complete 10 daily questions',
        icon: '📅',
        color: 'indigo',
        requirement: 10,
        category: 'daily'
      },
      knowledge_seeker: {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Complete quizzes in 5 different subjects',
        icon: '📚',
        color: 'emerald',
        requirement: 5,
        category: 'subjects'
      },
      point_collector: {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 1000 points',
        icon: '💎',
        color: 'pink',
        requirement: 1000,
        category: 'points'
      },
      level_up_5: {
        id: 'level_up_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '🌟',
        color: 'yellow',
        requirement: 5,
        category: 'level'
      },
      level_up_10: {
        id: 'level_up_10',
        name: 'Expert',
        description: 'Reach level 10',
        icon: '🏅',
        color: 'gold',
        requirement: 10,
        category: 'level'
      },
      // New level-based badges for full progression
      starter_badge: {
        id: 'starter_badge',
        name: 'Starter',
        description: 'Welcome to the learning journey!',
        icon: '🚀',
        color: 'blue',
        requirement: 1,
        category: 'level'
      },
      bronze_badge: {
        id: 'bronze_badge',
        name: 'Bronze Learner',
        description: 'Reach level 3',
        icon: '🥉',
        color: 'amber',
        requirement: 3,
        category: 'level'
      },
      silver_badge: {
        id: 'silver_badge',
        name: 'Silver Scholar',
        description: 'Reach level 5',
        icon: '🥈',
        color: 'gray',
        requirement: 5,
        category: 'level'
      },
      gold_badge: {
        id: 'gold_badge',
        name: 'Gold Graduate',
        description: 'Reach level 7',
        icon: '🥇',
        color: 'yellow',
        requirement: 7,
        category: 'level'
      },
      platinum_badge: {
        id: 'platinum_badge',
        name: 'Platinum Master',
        description: 'Reach level 9',
        icon: '💎',
        color: 'cyan',
        requirement: 9,
        category: 'level'
      },
      simulation_explorer: {
        id: 'simulation_explorer',
        name: 'Simulation Explorer',
        description: 'Complete 5 simulations',
        icon: '🔬',
        color: 'teal',
        requirement: 5,
        category: 'simulation'
      }
    };
  }

  /**
   * Check and award badges to a user based on their current stats
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Newly awarded badges
   */
  async checkAndAwardBadges(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return [];

      const newBadges = [];
      const currentBadges = user.badges || [];

      // Check each badge definition
      for (const [badgeId, badge] of Object.entries(this.badgeDefinitions)) {
        // Skip if user already has this badge
        if (currentBadges.some(userBadge => userBadge.id === badgeId)) {
          continue;
        }

        let shouldAward = false;

        switch (badge.category) {
          case 'quiz':
            shouldAward = user.completedQuizzes >= badge.requirement;
            break;
          case 'streak':
            shouldAward = (user.quizStreak || 0) >= badge.requirement;
            break;
          case 'score':
            shouldAward = (user.highestScore || 0) >= badge.requirement;
            break;
          case 'average':
            shouldAward = (user.averageScore || 0) >= badge.requirement;
            break;
          case 'speed':
            shouldAward = (user.fastestTime || Infinity) <= badge.requirement;
            break;
          case 'daily':
            shouldAward = (user.dailyQuestionsCompleted || 0) >= badge.requirement;
            break;
          case 'subjects':
            const uniqueSubjects = user.quizHistory ? 
              [...new Set(user.quizHistory.map(quiz => quiz.subject))].length : 0;
            shouldAward = uniqueSubjects >= badge.requirement;
            break;
          case 'points':
            shouldAward = (user.points || 0) >= badge.requirement;
            break;
          case 'level':
            shouldAward = (user.level || 1) >= badge.requirement;
            break;
          case 'simulation':
            shouldAward = (user.completedSimulations || 0) >= badge.requirement;
            break;
        }

        if (shouldAward) {
          const newBadge = {
            ...badge,
            earnedAt: new Date()
          };
          newBadges.push(newBadge);
          currentBadges.push(newBadge);
        }
      }

      // Update user with new badges
      if (newBadges.length > 0) {
        await User.findByIdAndUpdate(userId, { badges: currentBadges });
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  /**
   * Get all available badges with user's progress
   * @param {string} userId - User ID
   * @returns {Promise<Array>} All badges with progress
   */
  async getBadgesWithProgress(userId) {
    try {
      const user = await User.findById(userId);
      
      // If user not found, still return all badge definitions with no progress
      const userBadges = user?.badges || [];
      const badges = [];

      for (const [badgeId, badge] of Object.entries(this.badgeDefinitions)) {
        const userBadge = userBadges.find(b => b.id === badgeId);
        const isEarned = !!userBadge;

        let current = 0;
        if (user) {
          switch (badge.category) {
            case 'quiz':
              current = user.completedQuizzes || 0;
              break;
            case 'streak':
              current = user.quizStreak || 0;
              break;
            case 'score':
              current = user.highestScore || 0;
              break;
            case 'average':
              current = user.averageScore || 0;
              break;
            case 'speed':
              current = user.fastestTime || 0;
              break;
            case 'daily':
              current = user.dailyQuestionsCompleted || 0;
              break;
            case 'subjects':
              current = user.quizHistory ? 
                [...new Set(user.quizHistory.map(quiz => quiz.subject))].length : 0;
              break;
            case 'points':
              current = user.points || 0;
              break;
            case 'level':
              current = user.level || 1;
              break;
            case 'simulation':
              current = user.completedSimulations || 0;
              break;
          }
        }

        badges.push({
          ...badge,
          isEarned,
          earnedAt: userBadge?.earnedAt,
          current,
          progress: Math.min(100, (current / badge.requirement) * 100)
        });
      }

      return badges.sort((a, b) => {
        if (a.isEarned && !b.isEarned) return -1;
        if (!a.isEarned && b.isEarned) return 1;
        return b.progress - a.progress;
      });
    } catch (error) {
      console.error('Error getting badges:', error);
      
      // Fallback: return all badge definitions with no progress if DB fails
      const badges = [];
      for (const [badgeId, badge] of Object.entries(this.badgeDefinitions)) {
        badges.push({
          ...badge,
          isEarned: false,
          earnedAt: null,
          current: 0,
          progress: 0
        });
      }
      return badges;
    }
  }

  /**
   * Get all badge definitions
   * @returns {Object} Badge definitions
   */
  getBadgeDefinitions() {
    return this.badgeDefinitions;
  }
}

module.exports = new BadgeService();