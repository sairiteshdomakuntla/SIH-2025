const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get available chat rooms
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('activeUsers', 'name level avatar')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        roomId: room.roomId,
        name: room.name,
        subject: room.subject,
        description: room.description,
        activeUsersCount: room.activeUsers.length,
        totalMessages: room.totalMessages,
        maxUsers: room.maxUsers,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt,
        createdBy: room.createdBy
      }))
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get room messages with pagination
router.get('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ roomId })
      .populate('userId', 'name level avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      messages: messages.reverse(),
      currentPage: parseInt(page),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new room
router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, subject, description, isPrivate = false, maxUsers = 50 } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!name || !subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room name and subject are required' 
      });
    }

    if (name.length > 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room name must be 50 characters or less' 
      });
    }

    if (description && description.length > 200) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description must be 200 characters or less' 
      });
    }

    // Check if user already has rooms with the same name
    const existingRoom = await Room.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: userId 
    });

    if (existingRoom) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a room with this name' 
      });
    }

    // Generate unique room ID
    const roomId = `${subject.toLowerCase().replace(/\s+/g, '_')}_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    const room = new Room({
      roomId,
      name: name.trim(),
      subject,
      description: description ? description.trim() : '',
      isPrivate: Boolean(isPrivate),
      maxUsers: Math.min(Math.max(parseInt(maxUsers) || 50, 10), 100), // Between 10-100
      createdBy: userId,
      activeUsers: []
    });

    await room.save();

    // Populate the created room with creator info
    await room.populate('createdBy', 'name level avatar');

    res.json({
      success: true,
      message: 'Room created successfully',
      room: {
        roomId: room.roomId,
        name: room.name,
        subject: room.subject,
        description: room.description,
        isPrivate: room.isPrivate,
        maxUsers: room.maxUsers,
        activeUsersCount: 0,
        totalMessages: 0,
        createdAt: room.createdAt,
        createdBy: room.createdBy
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a room (only creator can delete)
router.delete('/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if user is the creator
    if (room.createdBy.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the room creator can delete this room' 
      });
    }

    // Delete all messages in the room
    await Message.deleteMany({ roomId });

    // Delete the room
    await Room.deleteOne({ roomId });

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's created rooms
router.get('/my-rooms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const rooms = await Room.find({ createdBy: userId })
      .populate('activeUsers', 'name level avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        roomId: room.roomId,
        name: room.name,
        subject: room.subject,
        description: room.description,
        activeUsersCount: room.activeUsers.length,
        totalMessages: room.totalMessages,
        maxUsers: room.maxUsers,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt
      }))
    });
  } catch (error) {
    console.error('Get my rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get community leaderboard (filtered by user's grade level)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    // First get the current user to determine their grade level
    const currentUser = await User.findById(req.user.userId).select('grade');
    
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Filter leaderboard by same grade level as current user
    const topUsers = await User.find({ 
      grade: currentUser.grade  // Only users from the same grade
    })
      .select('name points level completedQuizzes avatar grade')
      .sort({ points: -1 })
      .limit(10);

    res.json({
      success: true,
      leaderboard: topUsers,
      userGrade: currentUser.grade  // Send back the grade for display purposes
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;