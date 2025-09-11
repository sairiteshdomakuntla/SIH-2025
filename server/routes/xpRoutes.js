const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const xpService = require('../services/xpService');
const badgeService = require('../services/badgeService');
const User = require('../models/User');

const router = express.Router();

// Get current user's XP and level information
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const xpInfo = await xpService.getUserXPInfo(userId);
    res.json({
      success: true,
      data: xpInfo
    });
  } catch (error) {
    console.error('Error getting user XP info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user XP information',
      error: error.message
    });
  }
});

// Get specific user's XP and level information
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is requesting their own data or has permission
    if (userId !== req.user.id) {
      // For now, allow viewing other users' XP info (for leaderboards)
      // You can add permission checks here if needed
    }

    const xpInfo = await xpService.getUserXPInfo(userId);
    res.json({
      success: true,
      data: xpInfo
    });
  } catch (error) {
    console.error('Error getting user XP info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user XP information',
      error: error.message
    });
  }
});

// Get weekly leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await xpService.getWeeklyLeaderboard(limit);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
});

// Get XP rewards configuration (for frontend display)
router.get('/rewards', (req, res) => {
  try {
    const rewards = xpService.getXPRewards();
    const levels = xpService.getLevelThresholds();
    
    res.json({
      success: true,
      data: {
        rewards,
        levels
      }
    });
  } catch (error) {
    console.error('Error getting XP configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get XP configuration',
      error: error.message
    });
  }
});

// Award manual XP (admin only - for testing or special events)
router.post('/award', authenticateToken, async (req, res) => {
  try {
    const { userId, action, reason } = req.body;
    
    // In a real app, you'd check if the requesting user is an admin
    // For now, allow users to award XP to themselves for testing
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to award XP to other users'
      });
    }

    const result = await xpService.awardXP(userId, action);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: `XP awarded for ${action}`,
      data: result
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award XP',
      error: error.message
    });
  }
});

// Get current user's badges with progress
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const badges = await badgeService.getBadgesWithProgress(userId);
    
    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Error getting badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badges',
      error: error.message
    });
  }
});

// Debug endpoint to get all badge definitions
router.get('/badges/definitions', authenticateToken, async (req, res) => {
  try {
    const definitions = badgeService.getBadgeDefinitions();
    res.json({
      success: true,
      data: Object.values(definitions),
      count: Object.keys(definitions).length
    });
  } catch (error) {
    console.error('Error getting badge definitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badge definitions',
      error: error.message
    });
  }
});

// Get specific user's badges with progress
router.get('/badges/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const badges = await badgeService.getBadgesWithProgress(userId);
    
    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Error getting badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badges',
      error: error.message
    });
  }
});

// Get current user's recent XP activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // For now, return empty array - implement XP history tracking if needed
    const activity = [];
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting XP activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get XP activity',
      error: error.message
    });
  }
});

// Get specific user's recent XP activity
router.get('/activity/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // For now, return empty array - implement XP history tracking if needed
    const activity = [];
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting XP activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get XP activity',
      error: error.message
    });
  }
});

// Reset weekly XP (cron job endpoint)
router.post('/reset-weekly', async (req, res) => {
  try {
    // In production, this should be secured or called by a cron job
    await User.updateMany({}, { 
      weeklyXP: 0, 
      lastWeeklyReset: new Date() 
    });
    
    res.json({
      success: true,
      message: 'Weekly XP reset completed'
    });
  } catch (error) {
    console.error('Error resetting weekly XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset weekly XP',
      error: error.message
    });
  }
});

module.exports = router;