const Room = require('../models/Room');
const User = require('../models/User');

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { quizId, subject, difficulty, capacity = 2, car = 'default' } = req.body;
    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create new room
    const roomData = {
      capacity,
      subject,
      difficulty,
      players: [{
        userId: userId,
        username: user.name,
        car: car
      }],
      participants: [userId]  // Also add to participants array
    };

    // Only add quizId if it's provided and not empty
    if (quizId && quizId.trim()) {
      roomData.quizId = quizId;
    }

    const room = new Room(roomData);

    await room.save();

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });

  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
};

// Join an existing room by code (simplified version)
const joinRoomByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { userId } = req.body;

    // Find room by code
    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    // Check if userId is already in participants array
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }

    return res.status(200).json({
      message: 'Joined room successfully',
      room
    });

  } catch (error) {
    console.error('Join room by code error:', error);
    return res.status(500).json({
      message: 'Failed to join room',
      error: error.message
    });
  }
};

// Join an existing room
const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { car = 'default' } = req.body;
    const userId = req.user.userId;

    // Find room by roomCode
    console.log(`Looking for room with roomCode: ${roomCode}`);
    let room = await Room.findOne({ roomCode });
    if (!room) {
      console.log(`Room not found with roomCode: ${roomCode}`);
      // Also try searching by 'code' field for compatibility
      room = await Room.findOne({ code: roomCode });
      if (!room) {
        console.log(`Room also not found with code: ${roomCode}`);
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      } else {
        console.log(`Found room with 'code' field: ${room._id}`);
      }
    } else {
      console.log(`Found room with roomCode: ${room._id}`);
    }

    // Check if room is at capacity
    console.log(`Room capacity: ${room.capacity}, current players: ${room.players.length}`);
    if (room.players.length >= room.capacity) {
      console.log(`❌ Room is at full capacity`);
      return res.status(400).json({
        success: false,
        message: 'Room is at full capacity'
      });
    }

    // Check if user is already in the room
    const existingPlayer = room.players.find(player => 
      player.userId.toString() === userId
    );
    
    console.log(`Checking if user ${userId} is already in room...`);
    console.log(`Existing players:`, room.players.map(p => ({ userId: p.userId.toString(), username: p.username })));
    
    if (existingPlayer) {
      console.log(`❌ User ${userId} is already in this room`);
      return res.status(400).json({
        success: false,
        message: 'You are already in this room'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add player to room
    room.players.push({
      userId: userId,
      username: user.name,
      car: car
    });

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Successfully joined room',
      room
    });

  } catch (error) {
    console.error('Join room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join room',
      error: error.message
    });
  }
};

// Set player ready status
const setReady = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { ready = true } = req.body;
    const userId = req.user.userId;

    // Find room
    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Find player in room
    const player = room.players.find(p => p.userId.toString() === userId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found in room'
      });
    }

    // Update ready status
    player.ready = ready;

    // Check if all players are ready
    const allReady = room.players.every(p => p.ready);
    if (allReady && room.players.length > 1) {
      room.status = 'active';
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Ready status updated',
      room,
      allReady
    });

  } catch (error) {
    console.error('Set ready error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ready status',
      error: error.message
    });
  }
};

// Complete room (submit score and time)
const completeRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { score, timeTaken } = req.body;
    const userId = req.user.userId;

    console.log(`Player ${userId} completing quiz with score: ${score}, time: ${timeTaken}`);

    // Validate input
    if (score === undefined || timeTaken === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Score and timeTaken are required'
      });
    }

    // Find room
    let room = await Room.findOne({ roomCode });
    if (!room) {
      room = await Room.findOne({ code: roomCode });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
    }

    // Find player in room
    const player = room.players.find(p => p.userId.toString() === userId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found in room'
      });
    }

    // Update player score and completion status
    player.score = score;
    player.timeTaken = timeTaken;
    player.hasFinished = true;
    player.finishedAt = new Date();

    await room.save();

    // Check if all players have finished
    const allFinished = room.players.every(p => p.hasFinished);
    console.log(`All players finished: ${allFinished}`);
    
    if (allFinished) {
      // Determine winner: highest score wins, if tie then fastest time wins
      const sortedPlayers = room.players.sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // Higher score first
        }
        return a.timeTaken - b.timeTaken; // Faster time first
      });

      const winner = sortedPlayers[0];
      room.winner = winner.userId;
      room.status = 'completed';
      room.quizEndedAt = new Date();
      
      await room.save();

      console.log(`Winner determined: ${winner.username} with score ${winner.score}`);

      // Emit to all players in room via socket
      const io = req.app.get('io');
      if (io) {
        io.to(roomCode).emit('quizCompleted', {
          winner: {
            userId: winner.userId,
            username: winner.username,
            score: winner.score,
            timeTaken: winner.timeTaken
          },
          results: room.players.map(p => ({
            userId: p.userId,
            username: p.username,
            score: p.score,
            timeTaken: p.timeTaken
          })),
          room: room
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz completed',
        gameCompleted: true,
        winner: {
          userId: winner.userId,
          username: winner.username,
          score: winner.score,
          timeTaken: winner.timeTaken
        },
        results: room.players.map(p => ({
          userId: p.userId,
          username: p.username,
          score: p.score,
          timeTaken: p.timeTaken
        }))
      });
    } else {
      // Emit to room that this player finished
      const io = req.app.get('io');
      if (io) {
        io.to(roomCode).emit('playerFinished', {
          userId: player.userId,
          username: player.username,
          score: player.score,
          timeTaken: player.timeTaken,
          waitingForOthers: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Your result submitted. Waiting for other players...',
        gameCompleted: false,
        waitingForOthers: true
      });
    }

  } catch (error) {
    console.error('Complete room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete room',
      error: error.message
    });
  }
};

// Get room details
const getRoomDetails = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ roomCode })
      .populate('players.userId', 'name')
      .populate('winner', 'name')
      .populate('quizId');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    return res.status(200).json({
      success: true,
      room
    });

  } catch (error) {
    console.error('Get room details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get room details',
      error: error.message
    });
  }
};

// Leave room
const leaveRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Remove player from room
    room.players = room.players.filter(p => p.userId.toString() !== userId);

    // If no players left, you might want to delete the room
    if (room.players.length === 0) {
      await Room.findOneAndDelete({ roomCode });
      return res.status(200).json({
        success: true,
        message: 'Left room and room deleted (no players remaining)'
      });
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Successfully left room',
      room
    });

  } catch (error) {
    console.error('Leave room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to leave room',
      error: error.message
    });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  joinRoomByCode,
  setReady,
  completeRoom,
  getRoomDetails,
  leaveRoom
};