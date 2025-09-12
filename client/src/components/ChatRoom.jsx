import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Send, ArrowLeft, Users, Hash, Crown, 
  Star, Zap, Smile, MoreVertical, Share2, Video, UserPlus 
} from 'lucide-react';
import ShareModal from './ShareModal';
import VideoCall from './VideoCall';
import VideoCallInvite from './VideoCallInvite';

const ChatRoom = ({ room, onBack }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [videoInviteOpen, setVideoInviteOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { 
    joinRoom, leaveRoom, sendMessage, startTyping, stopTyping,
    messages, activeUsers, typingUsers, currentRoom 
  } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (room) {
      joinRoom(room.roomId, room.subject);
    }
    
    return () => {
      if (room) {
        leaveRoom(room.roomId);
      }
    };
  }, [room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentRoom) {
      console.log('Sending message:', { roomId: currentRoom.roomId, content: message });
      sendMessage(currentRoom.roomId, message);
      setMessage('');
      handleStopTyping();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (!isTyping && currentRoom) {
      setIsTyping(true);
      startTyping(currentRoom.roomId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping && currentRoom) {
      setIsTyping(false);
      stopTyping(currentRoom.roomId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelIcon = (level) => {
    if (level >= 10) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (level >= 5) return <Star className="w-4 h-4 text-purple-400" />;
    return <Zap className="w-4 h-4 text-blue-400" />;
  };

  // Get current user ID - handle both _id and id formats
  const getCurrentUserId = () => {
    return user?._id || user?.id;
  };

  const startVideoCall = () => {
    setVideoCallActive(true);
  };

  const leaveVideoCall = () => {
    setVideoCallActive(false);
  };

  const openVideoInvite = () => {
    setVideoInviteOpen(true);
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Hash className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">Select a room to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Video Call Overlay */}
      <VideoCall
        room={room}
        user={user}
        onLeaveCall={leaveVideoCall}
        isVisible={videoCallActive}
      />

      {/* Chat Interface */}
      <div className={`flex flex-col h-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl ${videoCallActive ? 'hidden' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="lg:hidden text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
              <Hash className="w-5 h-5 text-white" />
            </div>
            
            <div>
              <h2 className="text-white font-semibold">{room.name}</h2>
              <p className="text-white/60 text-sm">{room.subject}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Video Call Button */}
            <button
              onClick={startVideoCall}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center space-x-2"
              title="Start Video Call"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Join Call</span>
            </button>

            {/* Invite to Video Call */}
            <button
              onClick={openVideoInvite}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              title="Invite to Video Call"
            >
              <UserPlus className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-white text-sm">{activeUsers.length}</span>
            </div>
            
            <button
              onClick={() => setShareModalOpen(true)}
              className="text-white/60 hover:text-white transition-colors p-2"
              title="Share Room"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            <button className="text-white/60 hover:text-white transition-colors p-2">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isOwnMessage = msg.userId._id === getCurrentUserId() || msg.userId === getCurrentUserId();
            
            return (
              <div
                key={msg._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {!isOwnMessage && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {msg.userId.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {!isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white/80 text-sm font-medium">
                          {msg.userId.name || 'Unknown User'}
                        </span>
                        {getLevelIcon(msg.userId.level || 1)}
                        <span className="text-white/40 text-xs">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {isOwnMessage && (
                        <p className="text-xs text-white/60 mt-1 text-right">
                          {formatTime(msg.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0].name} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-white/20">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <button
              type="button"
              className="text-white/60 hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Active Users Sidebar */}
        <div className="hidden xl:block w-64 border-l border-white/20 p-4">
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Active Users ({activeUsers.length})
            </h3>
            
            <div className="space-y-2">
              {activeUsers.map((activeUser) => (
                <div key={activeUser._id} className="flex items-center space-x-3 p-2 rounded-lg bg-white/5">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {activeUser.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {activeUser.name || 'Unknown User'}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getLevelIcon(activeUser.level || 1)}
                      <span className="text-white/60 text-xs">
                        Level {activeUser.level || 1}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Invite Modal */}
      <VideoCallInvite
        room={room}
        isVisible={videoInviteOpen}
        onClose={() => setVideoInviteOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        room={room}
      />
    </>
  );
};

export default ChatRoom;