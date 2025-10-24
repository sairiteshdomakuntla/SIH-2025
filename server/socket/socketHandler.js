const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const QuizRoom = require('../models/QuizRoom');
const quizService = require('../services/quizService');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map();
    this.roomUsers = new Map();
    this.quizRooms = new Map();
    // Add simple room storage for multiplayer quiz
    this.rooms = new Map(); // roomId -> { host: {id, name, socketId}, participants: [{id, name, socketId}], status: 'waiting|active|finished' }
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      this.handleConnection(socket);
    });
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          console.error('JWT verification failed:', err);
          return next(new Error('Authentication error: Invalid token'));
        }

        try {
          const user = await User.findById(decoded.userId).select('name level avatar location grade interests');
          if (!user) {
            return next(new Error('Authentication error: User not found'));
          }

          // Set both properties for compatibility
          socket.userId = decoded.userId;
          socket.user = {
            userId: decoded.userId,
            id: decoded.userId, // Add this for compatibility
            name: user.name,
            level: user.level,
            avatar: user.avatar,
            location: user.location,
            grade: user.grade,
            interests: user.interests
          };

          console.log(`Socket authenticated for user: ${user.name} (${decoded.userId})`);
          next();
        } catch (error) {
          console.error('Database error during socket authentication:', error);
          next(new Error('Authentication error: Database error'));
        }
      });
    } catch (error) {
      console.error('Socket authentication error:', error);
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

    // Socket event handlers (existing chat/video/etc handlers)
    socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
    socket.on('leave_room', (data) => this.handleLeaveRoom(socket, data));
    socket.on('send_message', (data) => this.handleSendMessage(socket, data));
    socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
    socket.on('join_video_call', (data) => this.handleJoinVideoCall(socket, data));
    socket.on('leave_video_call', (data) => this.handleLeaveVideoCall(socket, data));
    socket.on('moderator_action', (data) => this.handleModeratorAction(socket, data));
    
    // --- ADD: multiplayer quiz events (client emits createRoom/joinRoom/startQuiz) ---
    socket.on('createRoom', (data) => this.handleCreateRoom(socket, data));
    socket.on('joinRoom',   (data) => this.handleJoinRoomSimple(socket, data));
    socket.on('startQuiz',  (data) => this.handleStartMultiplayerQuiz(socket, data));
    // --- ADD: new event for submitting multiplayer quiz results ---
    socket.on('submitMultiplayerQuiz', (data) => this.handleSubmitMultiplayerQuiz(socket, data));
    // -------------------------------------------------------------------------------

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
    console.log(`Socket ${socket.id} disconnected`);
    
    // Remove from active users
    if (socket.user) {
      this.activeUsers.delete(socket.user.userId || socket.user.id);
      
      // Remove from all rooms they might be in
      for (const [roomId, users] of this.roomUsers.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          
          // Update room user count
          this.io.to(roomId).emit('room_users_updated', {
            userCount: users.size,
            users: Array.from(users).map(socketId => {
              const userSocket = this.io.sockets.sockets.get(socketId);
              return userSocket ? userSocket.user : null;
            }).filter(Boolean)
          });
          
          if (users.size === 0) {
            this.roomUsers.delete(roomId);
          }
        }
      }
      
      // Remove from quiz rooms
      for (const [roomId, users] of this.quizRooms.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          if (users.size === 0) {
            this.quizRooms.delete(roomId);
          }
        }
      }
      
      // Handle multiplayer quiz room cleanup
      this.handleRoomDisconnect(socket);
      
      console.log(`User ${socket.user.name} removed from active users`);
    }
  }

  // --- ADD THIS ENTIRE METHOD ---
  handleRoomDisconnect(socket) {
    if (socket.currentRoomId) {
      const room = this.rooms.get(socket.currentRoomId);
      if (room) {
        // If the host disconnects, notify everyone and close the room.
        if (room.host.socketId === socket.id) {
          this.io.to(socket.currentRoomId).emit('roomData', {
            host: null,
            participants: [],
            status: 'closed',
            message: 'The host has disconnected. The room is now closed.'
          });
          this.rooms.delete(socket.currentRoomId);
          console.log(`Multiplayer room ${socket.currentRoomId} closed due to host disconnect.`);
        } else {
          // If a participant disconnects, remove them and notify others.
          const participantIndex = room.participants.findIndex(p => p.socketId === socket.id);
          if (participantIndex > -1) {
            const participant = room.participants.splice(participantIndex, 1)[0];
            console.log(`Participant ${participant.name} left multiplayer room ${socket.currentRoomId}.`);
            
            // Notify remaining users in the room
            this.io.to(socket.currentRoomId).emit('roomData', {
              host: room.host,
              participants: room.participants,
              status: room.status,
              message: `${participant.name} has left the room.`
            });
          }
        }
      }
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

  // Quiz Room Methods
  async handleJoinQuizRoom(socket, data) {
    try {
      const { roomId } = data;
      const userId = socket.userId || socket.user?.userId || socket.user?.id;

      console.log('=== JOIN QUIZ ROOM DEBUG ===');
      console.log('Room ID:', roomId);
      console.log('User ID:', userId);
      console.log('Socket User:', socket.user);

      if (!userId) {
        console.log('No userId found');
        socket.emit('quiz_room_error', { message: 'Authentication required' });
        return;
      }

      const room = await QuizRoom.findOne({ roomId: roomId.toUpperCase() });

      console.log('Found room:', room ? 'Yes' : 'No');
      if (room) {
        console.log('Room participants before update:', room.participants.map(p => ({
          name: p.name,
          isHost: p.isHost,
          isConnected: p.isConnected,
          userId: p.userId
        })));
      }

      if (!room) {
        socket.emit('quiz_room_error', { message: 'Room not found' });
        return;
      }

      // Find participant by userId - handle both ObjectId and string formats
      const participant = room.participants.find(p => {
        const participantUserId = p.userId._id ? p.userId._id.toString() : p.userId.toString();
        return participantUserId === userId.toString();
      });
      
      console.log('Found participant:', participant ? 'Yes' : 'No');
      
      if (!participant) {
        socket.emit('quiz_room_error', { message: 'You are not a participant in this room' });
        return;
      }

      // Update participant's socket ID and connection status
      participant.socketId = socket.id;
      participant.isConnected = true;
      
      // Save the room with updated participant status
      await room.save();

      console.log('Updated participant:', {
        name: participant.name,
        isHost: participant.isHost,
        isConnected: participant.isConnected
      });

      socket.join(`quiz_room_${roomId}`);
      socket.quizRoomId = roomId;

      // Update quiz rooms map
      if (!this.quizRooms.has(roomId)) {
        this.quizRooms.set(roomId, new Set());
      }
      this.quizRooms.get(roomId).add(socket.id);

      // Reload room to get fresh data
      const updatedRoom = await QuizRoom.findOne({ roomId: roomId.toUpperCase() });

      // Prepare participant data for UI - ensure we get all participants with fresh data
      const participantsList = updatedRoom.participants.map(p => {
        const userId = p.userId._id ? p.userId._id.toString() : p.userId.toString();
        return {
          name: p.name,
          score: p.score || 0,
          finished: p.finished || false,
          isHost: p.isHost || false,
          isConnected: p.isConnected || false,
          userId: userId,
          socketId: p.socketId
        };
      });

      console.log('Final participants list to send:', participantsList);
      console.log('Current user is host:', participant.isHost);

      // Emit room joined with complete room state TO THE JOINING USER
      const roomData = {
        room: {
          roomId: updatedRoom.roomId,
          roomName: updatedRoom.roomName,
          hostName: updatedRoom.hostName,
          status: updatedRoom.status,
          isHost: participant.isHost,
          currentUserId: userId,
          participants: participantsList,
          quiz: updatedRoom.quiz
        }
      };

      console.log('Emitting quiz_room_joined to joining user:', socket.id);
      socket.emit('quiz_room_joined', roomData);

      // Broadcast updated participant list to ALL OTHER room members (excluding the person who just joined)
      console.log('Broadcasting participants_updated to other room members');
      const broadcastData = {
        participants: participantsList,
        message: `${participant.name} ${participant.isHost ? '(Host)' : ''} joined the room`,
        joinedParticipant: {
          name: participant.name,
          isHost: participant.isHost,
          isConnected: true
        },
        totalConnected: participantsList.filter(p => p.isConnected).length
      };

      console.log('Broadcasting data:', JSON.stringify(broadcastData, null, 2));
      socket.to(`quiz_room_${roomId}`).emit('participants_updated', broadcastData);

      // ALSO send the updated list to the person who just joined (in case they need the update)
      socket.emit('participants_updated', broadcastData);

      console.log(`${participant.name} joined quiz room ${roomId} as ${participant.isHost ? 'host' : 'participant'}`);
      console.log('Connected participants count:', participantsList.filter(p => p.isConnected).length);
      console.log('=== END JOIN QUIZ ROOM DEBUG ===');

    } catch (error) {
      console.error('Error joining quiz room:', error);
      socket.emit('quiz_room_error', { message: 'Failed to join room' });
    }
  }

  async handleStartQuiz(socket, data) {
    try {
      const { roomId } = data;
      const userId = socket.userId || socket.user?.userId || socket.user?.id;

      console.log('Start quiz request:', { roomId, userId, socketUser: socket.user });

      if (!userId) {
        socket.emit('quiz_room_error', { message: 'Authentication required' });
        return;
      }

      const room = await QuizRoom.findOne({ roomId: roomId.toUpperCase() });

      if (!room) {
        socket.emit('quiz_room_error', { message: 'Room not found' });
        return;
      }

      // Verify user is host
      if (room.hostId.toString() !== userId) {
        socket.emit('quiz_room_error', { message: 'Only the host can start the quiz' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('quiz_room_error', { message: 'Quiz already started or finished' });
        return;
      }

      // Verify host is connected
      const hostParticipant = room.participants.find(p => p.isHost && p.userId.toString() === userId);
      if (!hostParticipant || !hostParticipant.isConnected) {
        socket.emit('quiz_room_error', { message: 'Host must be connected to start quiz' });
        return;
      }

      // Check if there are connected participants (including host)
      const connectedParticipants = room.participants.filter(p => p.isConnected);
      if (connectedParticipants.length < 1) {
        socket.emit('quiz_room_error', { message: 'No participants connected to start quiz' });
        return;
      }

      // Generate quiz using existing service
      const quizData = await quizService.generateQuiz(userId);
      
      if (!quizData.success) {
        socket.emit('quiz_room_error', { message: 'Failed to generate quiz. Please try again.' });
        return;
      }

      // Add question numbers to match existing Quiz component format
      const questionsWithNumbers = quizData.questions.map((question, index) => ({
        ...question,
        questionNumber: index + 1
      }));

      room.quiz = {
        questions: questionsWithNumbers,
        subject: quizData.subject || 'General',
        difficulty: quizData.difficulty || 'Medium'
      };
      room.status = 'active';
      room.startedAt = new Date();

      await room.save();

      console.log(`Host ${socket.user.name} started quiz in room ${roomId} with ${connectedParticipants.length} participants`);

      // Emit quiz start to ALL participants in the room (including host)
      this.io.to(`quiz_room_${roomId}`).emit('quiz_started', {
        quiz: questionsWithNumbers,
        timeLimit: 600, // 10 minutes
        startedBy: socket.user.name,
        message: `Quiz started by ${socket.user.name}! Get ready!`,
        roomInfo: {
          roomId: room.roomId,
          roomName: room.roomName,
          participantCount: connectedParticipants.length
        }
      });

      // Also emit a general room update
      this.io.to(`quiz_room_${roomId}`).emit('room_status_changed', {
        status: 'active',
        message: 'Quiz has begun!'
      });

      console.log('Quiz started and emitted to all participants in room:', `quiz_room_${roomId}`);

    } catch (error) {
      console.error('Error starting quiz:', error);
      socket.emit('quiz_room_error', { message: 'Failed to start quiz. Please try again.' });
    }
  }

  async handleQuizAnswer(socket, data) {
    try {
      const { roomId, questionIndex, answer, timeTaken } = data;
      const userId = socket.userId || socket.user?.userId || socket.user?.id;

      if (!userId) {
        return;
      }

      const room = await QuizRoom.findOne({ roomId: roomId.toUpperCase() });

      if (!room || room.status !== 'active') {
        return;
      }

      const participant = room.participants.find(p => p.userId.toString() === userId);
      if (!participant) {
        return;
      }

      const question = room.quiz.questions[questionIndex];
      const isCorrect = answer === question.answer;

      // Update participant's answer
      const existingAnswerIndex = participant.answers.findIndex(a => a.questionIndex === questionIndex);
      const answerData = {
        questionIndex,
        answer,
        isCorrect,
        timeTaken
      };

      if (existingAnswerIndex >= 0) {
        participant.answers[existingAnswerIndex] = answerData;
      } else {
        participant.answers.push(answerData);
      }

      await room.save();

      // Emit answer received confirmation
      socket.emit('answer_recorded', { questionIndex, isCorrect });

      // Notify other participants about answer progress (optional)
      socket.to(`quiz_room_${roomId}`).emit('participant_answered', {
        participantName: participant.name,
        questionIndex,
        totalAnswered: participant.answers.length
      });

    } catch (error) {
      console.error('Error handling quiz answer:', error);
    }
  }

  async handleFinishQuiz(socket, data) {
    try {
      const { roomId } = data;
      const userId = socket.userId || socket.user?.userId || socket.user?.id;

      if (!userId) {
        return;
      }

      const room = await QuizRoom.findOne({ roomId: roomId.toUpperCase() });

      if (!room) {
        return;
      }

      const participant = room.participants.find(p => p.userId.toString() === userId);
      if (!participant) {
        return;
      }

      // Calculate score
      let score = 0;
      participant.answers.forEach(answer => {
        if (answer.isCorrect) score++;
      });

      participant.score = Math.round((score / room.quiz.questions.length) * 100);
      participant.finished = true;

      await room.save();

      // Emit individual finish confirmation
      socket.emit('quiz_submitted', { 
        score: participant.score,
        correctAnswers: score,
        totalQuestions: room.quiz.questions.length
      });

      // Notify other participants about completion
      socket.to(`quiz_room_${roomId}`).emit('participant_finished', {
        participantName: participant.name,
        score: participant.score
      });

      // Check if all connected participants finished
      const connectedParticipants = room.participants.filter(p => p.isConnected);
      const allFinished = connectedParticipants.every(p => p.finished);

      if (allFinished && connectedParticipants.length > 0) {
        room.status = 'finished';
        room.finishedAt = new Date();
        await room.save();

        // Calculate final results
        const results = connectedParticipants.map(p => ({
          name: p.name,
          score: p.score,
          correctAnswers: p.answers.filter(a => a.isCorrect).length,
          totalQuestions: room.quiz.questions.length,
          isHost: p.isHost
        })).sort((a, b) => b.score - a.score);

        // Emit final results to all participants
        this.io.to(`quiz_room_${roomId}`).emit('quiz_finished', {
          results,
          winner: results[0],
          message: 'All participants have finished the quiz!'
        });
      }

    } catch (error) {
      console.error('Error finishing quiz:', error);
    }
  }

  handleLeaveQuizRoom(socket) {
    if (socket.quizRoomId) {
      const roomId = socket.quizRoomId;
      
      // Update participant connection status
      QuizRoom.findOne({ roomId: roomId.toUpperCase() })
        .then(room => {
          if (room) {
            const participant = room.participants.find(p => p.socketId === socket.id);
            if (participant) {
              participant.isConnected = false;
              participant.socketId = null;
              return room.save().then(() => {
                // Broadcast updated participant list
                const participantsList = room.participants.map(p => ({
                  name: p.name,
                  score: p.score,
                  finished: p.finished,
                  isHost: p.isHost,
                  isConnected: p.isConnected,
                  userId: p.userId.toString()
                }));

                socket.to(`quiz_room_${roomId}`).emit('participants_updated', {
                  participants: participantsList,
                  message: `${participant.name} ${participant.isHost ? '(Host)' : ''} left the room`,
                  leftParticipant: {
                    name: participant.name,
                    isHost: participant.isHost,
                    isConnected: false
                  }
                });

                console.log(`${participant.name} left quiz room ${roomId}`);
              });
            }
          }
        })
        .catch(error => console.error('Error updating participant status:', error));

      socket.leave(`quiz_room_${roomId}`);
      
      if (this.quizRooms.has(roomId)) {
        this.quizRooms.get(roomId).delete(socket.id);
        if (this.quizRooms.get(roomId).size === 0) {
          this.quizRooms.delete(roomId);
        }
      }
    }
  }

  // Step 1: Client A (host) connects → emits createRoom({roomId, username})
  handleCreateRoom(socket, data) {
    try {
      const { roomId, username } = data;
      const userId = socket.userId || socket.user?.userId || socket.user?.id;
      
      console.log('=== CREATE ROOM ===');
      console.log('Room ID:', roomId);
      console.log('Host:', username);
      console.log('User ID:', userId);

      if (!userId || !roomId || !username) {
        socket.emit('error', { message: 'Missing required data' });
        return;
      }

      // Check if room already exists
      if (this.rooms.has(roomId.toUpperCase())) {
        socket.emit('error', { message: 'Room already exists' });
        return;
      }

      // Create room
      const roomData = {
        host: {
          id: userId,
          name: username,
          socketId: socket.id
        },
        participants: [],
        status: 'waiting',
        quiz: null
      };

      this.rooms.set(roomId.toUpperCase(), roomData);
      
      // Join socket room
      socket.join(roomId.toUpperCase());
      socket.currentRoomId = roomId.toUpperCase();
      
      console.log('Room created:', roomData);
      
      // Emit back to host
      socket.emit('roomCreated', {
        roomId: roomId.toUpperCase(),
        success: true
      });
      
      // Send initial room data to host
      socket.emit('roomData', {
        host: roomData.host,
        participants: roomData.participants,
        status: roomData.status
      });

      console.log('=== CREATE ROOM COMPLETE ===');

    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  }

  // Step 2: Client B (participant) connects → emits joinRoom({roomId, username})
  handleJoinRoomSimple(socket, data) {
    try {
      const { roomId, username } = data;
      const userId = socket.userId || socket.user?.userId || socket.user?.id;
      
      console.log('=== JOIN ROOM ===');
      console.log('Room ID:', roomId);
      console.log('Participant:', username);
      console.log('User ID:', userId);

      if (!userId || !roomId || !username) {
        socket.emit('error', { message: 'Missing required data' });
        return;
      }

      const room = this.rooms.get(roomId.toUpperCase());
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('error', { message: 'Room is not accepting participants' });
        return;
      }

      // Check if user already in room
      const isHost = room.host.id === userId;
      const existingParticipant = room.participants.find(p => p.id === userId);
      
      if (isHost || existingParticipant) {
        socket.emit('error', { message: 'You are already in this room' });
        return;
      }

      // Add participant to room
      const participant = {
        id: userId,
        name: username,
        socketId: socket.id
      };

      room.participants.push(participant);
      
      // Join socket room
      socket.join(roomId.toUpperCase());
      socket.currentRoomId = roomId.toUpperCase();
      
      console.log('Participant added:', participant);
      console.log('Room now has:', room.participants.length + 1, 'members');
      
      // Emit to ALL clients in the room (including the one who just joined)
      this.io.to(roomId.toUpperCase()).emit('roomData', {
        host: room.host,
        participants: room.participants,
        status: room.status,
        message: `${username} joined the room`
      });

      console.log('=== JOIN ROOM COMPLETE ===');

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  // Step 3: Host clicks Start Quiz → emits startQuiz({roomId})
  async handleStartMultiplayerQuiz(socket, data) {
    try {
        const { roomId } = data;
        const userId = socket.userId || socket.user?.userId || socket.user?.id;
        
        console.log('=== DYNAMIC QUIZ START REQUEST ===', { roomId, userId });

        if (!userId || !roomId) {
            return socket.emit('error', { message: 'Missing required data to start quiz.' });
        }

        const room = this.rooms.get(roomId.toUpperCase());
        if (!room) {
            return socket.emit('error', { message: 'Room not found.' });
        }

        if (room.host.id !== userId) {
            return socket.emit('error', { message: 'Only the host can start the quiz.' });
        }

        if (room.status !== 'waiting') {
            return socket.emit('error', { message: 'Quiz has already started or finished.' });
        }

        // --- DYNAMIC QUIZ GENERATION ---
        console.log(`Generating dynamic quiz for room ${roomId} using host's preferences...`);
        // Use the new, reliable socket-specific method
        const quizData = await quizService.generateQuizForSocket(userId);
        
        if (!quizData.success || !quizData.questions || quizData.questions.length === 0) {
            console.error('Quiz generation failed:', quizData.message);
            return socket.emit('error', { message: `Failed to generate quiz: ${quizData.message || 'Please try again.'}` });
        }

        const questionsWithNumbers = quizData.questions.map((question, index) => ({
            ...question,
            questionNumber: index + 1
        }));

        // Store the single, definitive quiz in the room's state
        room.quiz = questionsWithNumbers;
        room.status = 'active';
        // Initialize results array for all current members
        const allMembers = [room.host, ...room.participants];
        room.results = allMembers.map(p => ({ id: p.id, name: p.name, score: 0, time: 0, finished: false }));

        console.log(`Dynamic quiz with ${questionsWithNumbers.length} questions generated for room ${roomId}.`);

        // Broadcast the same quiz to EVERYONE in the room
        this.io.to(roomId.toUpperCase()).emit('quizStarted', {
            quiz: questionsWithNumbers,
            timeLimit: 600, // 10 minutes
            startedBy: room.host.name,
        });

    } catch (error) {
        console.error('Critical error in handleStartMultiplayerQuiz:', error);
        socket.emit('error', { message: 'A server error occurred while starting the quiz.' });
    }
}

// --- ADD THIS NEW METHOD to handle results and declare a winner ---
async handleSubmitMultiplayerQuiz(socket, data) {
    try {
        const { roomId, score, timeTaken } = data;
        const userId = socket.userId || socket.user?.userId || socket.user?.id;

        console.log('=== QUIZ SUBMISSION RECEIVED ===', { roomId, userId, score, timeTaken });

        const room = this.rooms.get(roomId.toUpperCase());
        if (!room || room.status !== 'active') {
            return; // Ignore submissions for inactive rooms
        }

        // Find and update the participant's result
        const result = room.results.find(r => r.id === userId);
        if (result && !result.finished) {
            result.score = score;
            result.time = timeTaken;
            result.finished = true;
        }

        // Notify everyone that this user has finished
        this.io.to(roomId.toUpperCase()).emit('participantFinished', {
            userId: userId,
            name: socket.user.name,
            results: room.results // Send updated progress
        });

        // Check if all participants have finished
        const allFinished = room.results.every(r => r.finished);
        if (allFinished) {
            console.log(`All participants in room ${roomId} have finished. Calculating winner...`);

            // Sort results: primary by score (desc), secondary by time (asc)
            room.results.sort((a, b) => {
                if (a.score !== b.score) {
                    return b.score - a.score; // Higher score first
                }
                return a.time - b.time; // Lower time first
            });

            room.status = 'finished';

            // Broadcast the final leaderboard to everyone
            this.io.to(roomId.toUpperCase()).emit('multiplayerQuizEnded', {
                leaderboard: room.results,
                winner: room.results[0]
            });
            console.log(`Winner for room ${roomId} is ${room.results[0].name}. Final results sent.`);
        }
    } catch (error) {
        console.error('Error handling multiplayer quiz submission:', error);
    }
}
}

module.exports = SocketHandler;