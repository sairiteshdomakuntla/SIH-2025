import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [xpNotification, setXpNotification] = useState(null);
  const { user, loading } = useAuth();

  // Get backend URL with fallback
  const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      console.log('⏳ Auth still loading...');
      return;
    }

    if (user && (user._id || user.id)) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        return;
      }

      const backendUrl = getBackendUrl();
      console.log('🔄 Connecting to socket at:', backendUrl);
      console.log('👤 User:', { id: user._id || user.id, name: user.name });

      const newSocket = io(backendUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('✅ Connected to server');
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('❌ Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnected(false);
      });

      // Room events
      newSocket.on('room_joined', ({ roomId, subject, activeUsers, messages }) => {
        console.log('✅ Joined room:', roomId);
        setCurrentRoom({ roomId, subject });
        setActiveUsers(activeUsers);
        setMessages(messages);
      });

      newSocket.on('room_left', ({ roomId }) => {
        console.log('👋 Left room:', roomId);
        setCurrentRoom(null);
        setActiveUsers([]);
        setMessages([]);
      });

      newSocket.on('user_joined', ({ user, activeUsers }) => {
        console.log('👤 User joined:', user.name);
        setActiveUsers(activeUsers);
        setMessages(prev => [...prev, {
          _id: Date.now(),
          content: `${user.name} joined the room`,
          messageType: 'system',
          createdAt: new Date()
        }]);
      });

      newSocket.on('user_left', ({ userId, activeUsers }) => {
        console.log('👤 User left:', userId);
        setActiveUsers(activeUsers);
      });

      // Message events
      newSocket.on('new_message', (message) => {
        console.log('💬 New message received:', message);
        setMessages(prev => [...prev, message]);
      });

      // Typing events
      newSocket.on('user_typing', ({ userId, name }) => {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, name }]);
      });

      newSocket.on('user_stop_typing', ({ userId }) => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      });

      // XP and level events
      newSocket.on('xp_awarded', (data) => {
        console.log(`🎯 +${data.xpAwarded} XP for ${data.action}!`);
        setXpNotification(data);
      });

      newSocket.on('user_level_up', ({ userId, name, oldLevel, newLevel, totalXP, unlocks }) => {
        console.log(`🎉 ${name} leveled up to Level ${newLevel}!`);
        setMessages(prev => [...prev, {
          _id: Date.now(),
          content: `🎉 ${name} leveled up to Level ${newLevel}!`,
          messageType: 'system',
          createdAt: new Date()
        }]);
      });

      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.close();
      };
    } else {
      // User logged out, clean up socket
      if (socket) {
        console.log('🔌 User logged out, cleaning up socket');
        socket.close();
        setSocket(null);
        setConnected(false);
        setCurrentRoom(null);
        setMessages([]);
        setActiveUsers([]);
        setTypingUsers([]);
      }
    }
  }, [user?._id || user?.id, loading]); // Use user ID to prevent reconnections from user object changes

  const joinRoom = (roomId, subject) => {
    if (socket && connected) {
      console.log('🚪 Joining room:', roomId);
      socket.emit('join_room', { roomId, subject });
    } else {
      console.warn('⚠️ Cannot join room - socket not connected');
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      console.log('🚪 Leaving room:', roomId);
      socket.emit('leave_room', { roomId });
    } else {
      console.warn('⚠️ Cannot leave room - socket not connected');
    }
  };

  const sendMessage = (roomId, content) => {
    if (socket && connected && content.trim()) {
      console.log('💬 Sending message:', { roomId, content });
      socket.emit('send_message', { roomId, content });
    } else {
      console.warn('⚠️ Cannot send message - socket not connected or empty content');
    }
  };

  const startTyping = (roomId) => {
    if (socket && connected) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket && connected) {
      socket.emit('typing_stop', { roomId });
    }
  };

  const clearXpNotification = () => {
    setXpNotification(null);
  };

  const value = {
    socket,
    connected,
    currentRoom,
    messages,
    activeUsers,
    typingUsers,
    xpNotification,
    clearXpNotification,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};