const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const {
  createRoom,
  joinRoom,
  joinRoomByCode,
  setReady,
  completeRoom,
  getRoomDetails
} = require('../controllers/roomController');

const router = express.Router();

// Create a new room
router.post('/create', authenticateToken, createRoom);

// Join an existing room (detailed version)
router.post('/join/:roomCode', authenticateToken, joinRoom);

// Join room by code (simplified version)
router.post('/join-by-code/:code', authenticateToken, joinRoomByCode);

// Set ready status
router.patch('/:roomCode/ready', authenticateToken, setReady);

// Complete room (submit score and time)
router.patch('/:roomCode/complete', authenticateToken, completeRoom);

// Get room details
router.get('/:roomCode', authenticateToken, getRoomDetails);

// Debug: List all rooms (temporary for debugging)
router.get('/debug/list', authenticateToken, async (req, res) => {
  try {
    const Room = require('../models/Room');
    const rooms = await Room.find({ status: 'waiting' })
      .select('roomCode code status subject difficulty capacity players')
      .limit(10);
    
    res.json({
      success: true,
      rooms: rooms.map(room => ({
        roomCode: room.roomCode,
        code: room.code,
        status: room.status,
        subject: room.subject,
        difficulty: room.difficulty,
        players: room.players.length,
        capacity: room.capacity
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;