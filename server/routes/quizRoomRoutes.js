const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QuizRoom = require('../models/QuizRoom');
const authMiddleware = require('../middleware/authMiddleware');
const quizService = require('../services/quizService');

const router = express.Router();

// Create a new quiz room
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { roomName, hostName } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Create room request:', { roomName, hostName, userId, user: req.user });

    if (!roomName || !hostName) {
      return res.status(400).json({
        success: false,
        message: 'Room name and host name are required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed'
      });
    }

    const roomId = uuidv4().substring(0, 8).toUpperCase();

    const quizRoom = new QuizRoom({
      roomId,
      roomName: roomName.trim(),
      hostName: hostName.trim(),
      hostId: userId,
      participants: [{
        userId,
        name: hostName.trim(),
        isHost: true, // Mark the creator as host
        isConnected: false, // Will be true when they join via socket
        score: 0,
        finished: false,
        answers: []
      }]
    });

    await quizRoom.save();

    console.log('Created room with participant:', {
      roomId: quizRoom.roomId,
      hostName: quizRoom.hostName,
      participants: quizRoom.participants.map(p => ({
        name: p.name,
        isHost: p.isHost,
        userId: p.userId
      }))
    });

    res.json({
      success: true,
      room: {
        roomId: quizRoom.roomId,
        roomName: quizRoom.roomName,
        hostName: quizRoom.hostName,
        isHost: true, // Let frontend know this user is the host
        participants: quizRoom.participants.map(p => ({
          name: p.name,
          isHost: p.isHost,
          isConnected: p.isConnected,
          score: p.score,
          finished: p.finished
        })),
        inviteLink: `${process.env.CLIENT_URL}/quiz?join=${quizRoom.roomId}`
      }
    });
  } catch (error) {
    console.error('Error creating quiz room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
});

// Join a quiz room
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { roomId, participantName } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Join room request:', { roomId, participantName, userId, user: req.user });

    if (!roomId || !participantName) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and participant name are required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed'
      });
    }

    const room = await QuizRoom.findOne({ roomId: roomId.toUpperCase() });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Room is not accepting new participants'
      });
    }

    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Check if user already in room
    const existingParticipant = room.participants.find(p => p.userId.toString() === userId);
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this room'
      });
    }

    // Check if this is the host rejoining (shouldn't happen but just in case)
    const isHost = room.hostId.toString() === userId;

    room.participants.push({
      userId,
      name: participantName.trim(),
      isHost: isHost, // Mark as host if this is the room creator
      isConnected: false, // Will be true when they join via socket
      score: 0,
      finished: false,
      answers: []
    });

    await room.save();

    console.log('Added participant to room:', {
      roomId: room.roomId,
      newParticipant: {
        name: participantName.trim(),
        isHost: isHost,
        userId
      },
      totalParticipants: room.participants.length
    });

    res.json({
      success: true,
      room: {
        roomId: room.roomId,
        roomName: room.roomName,
        hostName: room.hostName,
        isHost: isHost, // Let frontend know if this user is the host
        participants: room.participants.map(p => ({
          name: p.name,
          isHost: p.isHost,
          isConnected: p.isConnected,
          score: p.score,
          finished: p.finished
        }))
      }
    });
  } catch (error) {
    console.error('Error joining quiz room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
});

// Get room details
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId || req.user.id;
    
    const room = await QuizRoom.findOne({ roomId: roomId.toUpperCase() });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if current user is host
    const isHost = room.hostId.toString() === userId;

    res.json({
      success: true,
      room: {
        roomId: room.roomId,
        roomName: room.roomName,
        hostName: room.hostName,
        status: room.status,
        isHost: isHost,
        participants: room.participants.map(p => ({
          name: p.name,
          isHost: p.isHost,
          isConnected: p.isConnected,
          score: p.score,
          finished: p.finished
        })),
        quiz: room.quiz
      }
    });
  } catch (error) {
    console.error('Error getting room details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room details'
    });
  }
});

module.exports = router;
