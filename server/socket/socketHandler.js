const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // userId -> {socketId, user, rooms}
    this.roomUsers = new Map(); // roomId -> Set of userIds
    this.videoCalls = new Map(); // roomId -> Set of userIds in video call
    this.videoModerators = new Map(); // roomId -> userId of first person (moderator)
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      this.handleConnection(socket);
    });
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('No token provided for socket:', socket.id);
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.log('User not found for token:', decoded.userId);
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      console.log(`Socket authenticated for user: ${user.name} (${user._id})`);
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  }

  handleConnection(socket) {
    // Check if socket is properly authenticated
    if (!socket.user) {
      console.error('Socket connection without proper authentication:', socket.id);
      socket.disconnect(true);
      return;
    }

    console.log(`User ${socket.user.name} connected`);
    
    // Store user info
    this.activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      rooms: new Set()
    });

    // Socket event handlers
    socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
    socket.on('leave_room', (data) => this.handleLeaveRoom(socket, data));
    socket.on('send_message', (data) => this.handleSendMessage(socket, data));
    socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
    socket.on('join_video_call', (data) => this.handleJoinVideoCall(socket, data));
    socket.on('leave_video_call', (data) => this.handleLeaveVideoCall(socket, data));
    socket.on('moderator_action', (data) => this.handleModeratorAction(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected successfully',
      user: {
        id: socket.user._id,
        name: socket.user.name,
        level: socket.user.level
      }
    });
  }

  async handleJoinRoom(socket, data) {
    try {
      // Validate input data
      if (!data || typeof data !== 'object') {
        console.error('Invalid join room data:', data);
        socket.emit('error', { message: 'Invalid room data' });
        return;
      }

      const { roomId, subject } = data;

      // Validate roomId and subject
      if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
        console.error('Invalid roomId:', roomId);
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }

      if (!subject || typeof subject !== 'string' || subject.trim() === '') {
        console.error('Invalid subject:', subject);
        socket.emit('error', { message: 'Invalid subject' });
        return;
      }

      const cleanRoomId = roomId.trim();
      const cleanSubject = subject.trim();

      console.log(`${socket.user.name} attempting to join room: ${cleanRoomId}`);

      // Check if user is already in this room
      const userInfo = this.activeUsers.get(socket.userId);
      if (userInfo && userInfo.rooms.has(cleanRoomId)) {
        console.log(`User ${socket.user.name} already in room ${cleanRoomId}`);
        // Still send room data in case of reconnection
        const activeUsers = await this.getRoomActiveUsers(cleanRoomId);
        const messages = await Message.find({ roomId: cleanRoomId })
          .populate('userId', 'name level avatar')
          .sort({ createdAt: -1 })
          .limit(50);

        socket.emit('room_joined', {
          roomId: cleanRoomId,
          subject: cleanSubject,
          activeUsers,
          messages: messages.reverse()
        });
        return;
      }

      // Create or get room
      let room = await Room.findOne({ roomId: cleanRoomId });
      if (!room) {
        room = new Room({
          roomId: cleanRoomId,
          subject: cleanSubject,
          name: `${cleanSubject} Discussion`,
          description: `Chat room for ${cleanSubject} learners`,
          activeUsers: [],
          createdBy: socket.userId
        });
        await room.save();
        console.log(`Created new room: ${cleanRoomId}`);
      }

      // Join socket room
      socket.join(cleanRoomId);
      
      // Update user's rooms
      if (userInfo) {
        userInfo.rooms.add(cleanRoomId);
      }

      // Update room users
      if (!this.roomUsers.has(cleanRoomId)) {
        this.roomUsers.set(cleanRoomId, new Set());
      }
      this.roomUsers.get(cleanRoomId).add(socket.userId);

      // Update database
      await Room.findOneAndUpdate(
        { roomId: cleanRoomId },
        { $addToSet: { activeUsers: socket.userId } }
      );

      // Award XP for joining room
      await this.awardParticipationXP(socket.userId, 'join_room');

      // Get active users for this room
      const activeUsers = await this.getRoomActiveUsers(cleanRoomId);

      // Notify room about new user
      socket.to(cleanRoomId).emit('user_joined', {
        user: {
          _id: socket.userId,
          name: socket.user.name,
          level: socket.user.level,
          avatar: socket.user.avatar
        },
        activeUsers
      });

      // Send room data to user
      const messages = await Message.find({ roomId: cleanRoomId })
        .populate('userId', 'name level avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      socket.emit('room_joined', {
        roomId: cleanRoomId,
        subject: cleanSubject,
        activeUsers,
        messages: messages.reverse()
      });

      console.log(`User ${socket.user.name} joined room ${cleanRoomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  async handleLeaveRoom(socket, data) {
    try {
      // Validate input data
      if (!data || typeof data !== 'object') {
        console.error('Invalid leave room data:', data);
        return;
      }

      const { roomId } = data;

      // Validate roomId
      if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
        console.error('Invalid roomId for leave:', roomId);
        return;
      }

      const cleanRoomId = roomId.trim();

      socket.leave(cleanRoomId);
      
      // Update user's rooms
      const userInfo = this.activeUsers.get(socket.userId);
      if (userInfo) {
        userInfo.rooms.delete(cleanRoomId);
      }

      // Update room users
      if (this.roomUsers.has(cleanRoomId)) {
        this.roomUsers.get(cleanRoomId).delete(socket.userId);
      }

      // Update database
      await Room.findOneAndUpdate(
        { roomId: cleanRoomId },
        { $pull: { activeUsers: socket.userId } }
      );

      // Also leave video call if in one
      await this.handleLeaveVideoCall(socket, { roomId: cleanRoomId });

      // Get updated active users
      const activeUsers = await this.getRoomActiveUsers(cleanRoomId);

      // Notify room about user leaving
      socket.to(cleanRoomId).emit('user_left', {
        userId: socket.userId,
        activeUsers
      });

      console.log(`User ${socket.user.name} left room ${cleanRoomId}`);
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  async handleSendMessage(socket, data) {
    try {
      // Validate input data
      if (!data || typeof data !== 'object') {
        console.error('Invalid message data:', data);
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      const { roomId, content } = data;

      // Validate roomId and content
      if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
        console.error('Invalid roomId for message:', roomId);
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }

      if (!content || typeof content !== 'string' || content.trim() === '') {
        console.error('Invalid message content:', content);
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      const cleanRoomId = roomId.trim();
      const cleanContent = content.trim();

      // Create message
      const message = new Message({
        content: cleanContent,
        userId: socket.userId,
        roomId: cleanRoomId,
        createdAt: new Date()
      });

      await message.save();
      await message.populate('userId', 'name level avatar');

      // Increment room's total message count
      await Room.findOneAndUpdate(
        { roomId: cleanRoomId },
        { $inc: { totalMessages: 1 } }
      );

      // Award XP for participation
      await this.awardParticipationXP(socket.userId, 'message');

      // Broadcast message to room
      this.io.to(cleanRoomId).emit('new_message', {
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

  handleTypingStart(socket, data) {
    if (!data || !data.roomId) {
      console.error('Invalid typing start data:', data);
      return;
    }

    const cleanRoomId = data.roomId.trim();
    socket.to(cleanRoomId).emit('user_typing', {
      userId: socket.userId,
      name: socket.user.name
    });
  }

  handleTypingStop(socket, data) {
    if (!data || !data.roomId) {
      console.error('Invalid typing stop data:', data);
      return;
    }

    const cleanRoomId = data.roomId.trim();
    socket.to(cleanRoomId).emit('user_stop_typing', {
      userId: socket.userId
    });
  }

  async handleJoinVideoCall(socket, data) {
    try {
      // Validate input data
      if (!data || !data.roomId) {
        console.error('Invalid video call join data:', data);
        socket.emit('error', { message: 'Invalid room ID for video call' });
        return;
      }

      const cleanRoomId = data.roomId.trim();

      // Initialize video call set for room if doesn't exist
      if (!this.videoCalls.has(cleanRoomId)) {
        this.videoCalls.set(cleanRoomId, new Set());
      }

      // Check if this is the first person joining the video call (becomes moderator)
      const isFirstParticipant = this.videoCalls.get(cleanRoomId).size === 0;
      
      if (isFirstParticipant) {
        this.videoModerators.set(cleanRoomId, socket.userId);
        console.log(`User ${socket.user.name} became moderator of video call in room ${cleanRoomId}`);
      }

      // Add user to video call
      this.videoCalls.get(cleanRoomId).add(socket.userId);

      // Join video call room
      socket.join(`video_${cleanRoomId}`);

      // Award XP for joining video call
      await this.awardParticipationXP(socket.userId, 'video_call');

      // Notify room about user joining video call
      this.io.to(cleanRoomId).emit('user_joined_video', {
        userId: socket.userId,
        name: socket.user.name,
        isModerator: isFirstParticipant,
        moderatorId: this.videoModerators.get(cleanRoomId),
        videoCallParticipants: Array.from(this.videoCalls.get(cleanRoomId))
      });

      // Send moderator status to the joining user
      socket.emit('video_call_status', {
        isModerator: isFirstParticipant,
        moderatorId: this.videoModerators.get(cleanRoomId),
        participantCount: this.videoCalls.get(cleanRoomId).size
      });

      console.log(`User ${socket.user.name} joined video call in room ${cleanRoomId}${isFirstParticipant ? ' as moderator' : ''}`);
    } catch (error) {
      console.error('Join video call error:', error);
      socket.emit('error', { message: 'Failed to join video call' });
    }
  }

  async handleLeaveVideoCall(socket, data) {
    try {
      // Validate input data
      if (!data || !data.roomId) {
        console.error('Invalid video call leave data:', data);
        return;
      }

      const cleanRoomId = data.roomId.trim();
      let newModerator = null;

      if (this.videoCalls.has(cleanRoomId)) {
        const wasManager = this.videoModerators.get(cleanRoomId) === socket.userId;
        
        this.videoCalls.get(cleanRoomId).delete(socket.userId);
        
        // If moderator left and there are still participants, assign new moderator
        if (wasManager && this.videoCalls.get(cleanRoomId).size > 0) {
          const participants = Array.from(this.videoCalls.get(cleanRoomId));
          newModerator = participants[0]; // First remaining participant becomes moderator
          this.videoModerators.set(cleanRoomId, newModerator);
          
          console.log(`New moderator assigned in room ${cleanRoomId}: ${newModerator}`);
          
          // Notify new moderator
          const newModeratorInfo = this.activeUsers.get(newModerator);
          if (newModeratorInfo) {
            this.io.to(newModeratorInfo.socketId).emit('video_moderator_assigned', {
              roomId: cleanRoomId,
              isModerator: true
            });
          }
        }
        
        // If no one left in video call, remove the moderator
        if (this.videoCalls.get(cleanRoomId).size === 0) {
          this.videoCalls.delete(cleanRoomId);
          this.videoModerators.delete(cleanRoomId);
        }
      }

      // Leave video call room
      socket.leave(`video_${cleanRoomId}`);

      // Notify room about user leaving video call
      this.io.to(cleanRoomId).emit('user_left_video', {
        userId: socket.userId,
        name: socket.user.name,
        newModerator: newModerator,
        moderatorId: this.videoModerators.get(cleanRoomId),
        videoCallParticipants: this.videoCalls.has(cleanRoomId) ? Array.from(this.videoCalls.get(cleanRoomId)) : []
      });

      console.log(`User ${socket.user.name} left video call in room ${cleanRoomId}`);
    } catch (error) {
      console.error('Leave video call error:', error);
    }
  }

  async handleModeratorAction(socket, data) {
    try {
      const { roomId, action, targetUserId } = data;
      
      if (!roomId || !action) {
        socket.emit('error', { message: 'Invalid moderator action data' });
        return;
      }

      const cleanRoomId = roomId.trim();
      
      // Verify user is moderator
      if (this.videoModerators.get(cleanRoomId) !== socket.userId) {
        socket.emit('error', { message: 'Only moderators can perform this action' });
        return;
      }

      // Handle different moderator actions
      switch (action) {
        case 'admit_participant':
          this.io.to(`video_${cleanRoomId}`).emit('participant_admitted', {
            moderatorId: socket.userId,
            participantId: targetUserId
          });
          break;
          
        case 'reject_participant':
          this.io.to(`video_${cleanRoomId}`).emit('participant_rejected', {
            moderatorId: socket.userId,
            participantId: targetUserId
          });
          break;
          
        case 'toggle_lobby':
          this.io.to(`video_${cleanRoomId}`).emit('lobby_toggled', {
            moderatorId: socket.userId
          });
          break;
          
        default:
          socket.emit('error', { message: 'Unknown moderator action' });
      }
      
    } catch (error) {
      console.error('Moderator action error:', error);
      socket.emit('error', { message: 'Failed to perform moderator action' });
    }
  }

  async handleDisconnect(socket) {
    if (!socket.user) {
      console.log('Unauthenticated socket disconnected:', socket.id);
      return;
    }

    console.log(`User ${socket.user.name} disconnected`);

    const userInfo = this.activeUsers.get(socket.userId);
    if (userInfo) {
      // Leave all rooms the user was in
      for (const roomId of userInfo.rooms) {
        try {
          // Leave regular room
          await this.handleLeaveRoom(socket, { roomId });
          
          // Leave video call if in one
          await this.handleLeaveVideoCall(socket, { roomId });
        } catch (error) {
          console.error(`Error leaving room ${roomId} on disconnect:`, error);
        }
      }
      
      // Remove from active users
      this.activeUsers.delete(socket.userId);
    }

    // Clean up any orphaned video calls or moderator assignments
    try {
      for (const [roomId, participants] of this.videoCalls.entries()) {
        if (participants.has(socket.userId)) {
          participants.delete(socket.userId);
          
          // If this was the moderator, assign a new one
          if (this.videoModerators.get(roomId) === socket.userId) {
            if (participants.size > 0) {
              const newModerator = Array.from(participants)[0];
              this.videoModerators.set(roomId, newModerator);
              
              // Notify new moderator
              const newModeratorInfo = this.activeUsers.get(newModerator);
              if (newModeratorInfo) {
                this.io.to(newModeratorInfo.socketId).emit('video_moderator_assigned', {
                  roomId: roomId,
                  isModerator: true
                });
              }
            } else {
              // No participants left, clean up
              this.videoCalls.delete(roomId);
              this.videoModerators.delete(roomId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up video calls on disconnect:', error);
    }
  }

  async getRoomActiveUsers(roomId) {
    try {
      const room = await Room.findOne({ roomId })
        .populate('activeUsers', 'name level avatar');
      
      return room ? room.activeUsers : [];
    } catch (error) {
      console.error('Error getting room active users:', error);
      return [];
    }
  }

  async awardParticipationXP(userId, action) {
    try {
      const xpRewards = {
        'message': 2,
        'join_room': 5,
        'video_call': 10
      };

      const xpGain = xpRewards[action] || 0;
      if (xpGain > 0) {
        // Use both xp and points for compatibility
        const user = await User.findByIdAndUpdate(
          userId, 
          { 
            $inc: { 
              xp: xpGain,
              points: xpGain,
              totalXP: xpGain,
              weeklyXP: xpGain
            }
          },
          { new: true }
        );

        if (user) {
          // Emit XP notification to user
          const userInfo = this.activeUsers.get(userId);
          if (userInfo) {
            this.io.to(userInfo.socketId).emit('xp_awarded', {
              xpAwarded: xpGain,
              totalXP: user.xp || user.points || 0,
              action: action
            });
          }
        }
      }
    } catch (error) {
      console.error('Award XP error:', error);
    }
  }
}

module.exports = SocketHandler;