const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // userId -> { socketId, user, rooms }
    this.roomUsers = new Map(); // roomId -> Set of userIds
  }

  initialize() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  }

  handleConnection(socket) {
    console.log(`User ${socket.user.name} connected`);
    
    // Store active user
    this.activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      rooms: new Set()
    });

    // Socket event handlers
    socket.on('join_room', this.handleJoinRoom.bind(this, socket));
    socket.on('leave_room', this.handleLeaveRoom.bind(this, socket));
    socket.on('send_message', this.handleSendMessage.bind(this, socket));
    socket.on('typing_start', this.handleTypingStart.bind(this, socket));
    socket.on('typing_stop', this.handleTypingStop.bind(this, socket));
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  async handleJoinRoom(socket, { roomId, subject }) {
    try {
      // Create or get room
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({
          roomId,
          subject,
          name: `${subject} Discussion`,
          description: `Chat room for ${subject} learners`,
          activeUsers: []
        });
        await room.save();
      }

      // Join socket room
      socket.join(roomId);
      
      // Update user's rooms
      const userInfo = this.activeUsers.get(socket.userId);
      if (userInfo) {
        userInfo.rooms.add(roomId);
      }

      // Update room users
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      this.roomUsers.get(roomId).add(socket.userId);

      // Update database
      await Room.findOneAndUpdate(
        { roomId },
        { $addToSet: { activeUsers: socket.userId } }
      );

      // Get active users for this room
      const activeUsers = await this.getRoomActiveUsers(roomId);

      // Notify room about new user
      socket.to(roomId).emit('user_joined', {
        user: {
          _id: socket.userId,
          name: socket.user.name,
          level: socket.user.level,
          avatar: socket.user.avatar
        },
        activeUsers
      });

      // Send room data to user
      const messages = await Message.find({ roomId })
        .populate('userId', 'name level avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      socket.emit('room_joined', {
        roomId,
        subject,
        activeUsers,
        messages: messages.reverse()
      });

      console.log(`User ${socket.user.name} joined room ${roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  async handleLeaveRoom(socket, { roomId }) {
    try {
      socket.leave(roomId);

      // Update user's rooms
      const userInfo = this.activeUsers.get(socket.userId);
      if (userInfo) {
        userInfo.rooms.delete(roomId);
      }

      // Update room users
      if (this.roomUsers.has(roomId)) {
        this.roomUsers.get(roomId).delete(socket.userId);
      }

      // Update database
      await Room.findOneAndUpdate(
        { roomId },
        { $pull: { activeUsers: socket.userId } }
      );

      // Get updated active users
      const activeUsers = await this.getRoomActiveUsers(roomId);

      // Notify room about user leaving
      socket.to(roomId).emit('user_left', {
        userId: socket.userId,
        activeUsers
      });

      socket.emit('room_left', { roomId });
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  async handleSendMessage(socket, { roomId, content }) {
    try {
      if (!content.trim()) return;

      // Create message
      const message = new Message({
        content: content.trim(),
        userId: socket.userId,
        roomId,
        createdAt: new Date()
      });

      await message.save();
      await message.populate('userId', 'name level avatar');

      // Increment room's total message count
      await Room.findOneAndUpdate(
        { roomId },
        { $inc: { totalMessages: 1 } }
      );

      // Award XP for participation
      await this.awardParticipationXP(socket.userId, 'message');

      // Broadcast message to room
      this.io.to(roomId).emit('new_message', {
        _id: message._id,
        content: message.content,
        userId: message.userId,
        roomId: message.roomId,
        createdAt: message.createdAt
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleTypingStart(socket, { roomId }) {
    socket.to(roomId).emit('user_typing', {
      userId: socket.userId,
      name: socket.user.name
    });
  }

  handleTypingStop(socket, { roomId }) {
    socket.to(roomId).emit('user_stop_typing', {
      userId: socket.userId
    });
  }

  async handleDisconnect(socket) {
    console.log(`User ${socket.user.name} disconnected`);

    const userInfo = this.activeUsers.get(socket.userId);
    if (userInfo) {
      // Leave all rooms
      for (const roomId of userInfo.rooms) {
        await this.handleLeaveRoom(socket, { roomId });
      }
      
      // Remove from active users
      this.activeUsers.delete(socket.userId);
    }
  }

  async getRoomActiveUsers(roomId) {
    const room = await Room.findOne({ roomId })
      .populate('activeUsers', 'name level avatar');
    
    return room ? room.activeUsers : [];
  }

  async awardParticipationXP(userId, action) {
    try {
      const xpRewards = {
        message: 2,
        join_room: 1,
        helpful_message: 5 // For future implementation
      };

      const xp = xpRewards[action] || 0;
      if (xp === 0) return;

      const user = await User.findById(userId);
      if (!user) return;

      const oldLevel = user.level;
      user.points += xp;
      
      // Level up calculation (100 points per level)
      const newLevel = Math.floor(user.points / 100) + 1;
      if (newLevel > user.level) {
        user.level = newLevel;
        
        // Award level up badge
        user.achievements += 1;
        
        // Broadcast level up to all user's rooms
        const userInfo = this.activeUsers.get(userId.toString());
        if (userInfo) {
          for (const roomId of userInfo.rooms) {
            this.io.to(roomId).emit('user_level_up', {
              userId: userId.toString(),
              name: user.name,
              oldLevel,
              newLevel,
              points: user.points
            });
          }
        }
      }

      await user.save();

      // Send XP update to user
      const userSocket = this.activeUsers.get(userId.toString());
      if (userSocket) {
        this.io.to(userSocket.socketId).emit('xp_awarded', {
          action,
          xp,
          totalPoints: user.points,
          level: user.level,
          leveledUp: newLevel > oldLevel
        });
      }

    } catch (error) {
      console.error('Award XP error:', error);
    }
  }
}

module.exports = SocketHandler;