import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Send, ArrowLeft, Users, Hash, Crown, 
  Star, Zap, Smile, MoreVertical, Share2 
} from 'lucide-react';
import ShareModal from './ShareModal';

const ChatRoom = ({ room, onBack }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
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

  return (
    <>
      <div className="lg:col-span-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-white font-medium">{room.name}</h3>
                  <p className="text-white/60 text-sm">{room.subject}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/60">
                <Users className="w-4 h-4" />
                <span>{activeUsers.length}</span>
              </div>
              
              {/* Share Button */}
              <button
                onClick={() => setShareModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 transition-all duration-200"
                title="Share room"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 flex flex-col">
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                  const isCurrentUser = msg.userId?._id === getCurrentUserId() || msg.userId === getCurrentUserId();
                  
                  return (
                    <div key={msg._id || index}>
                      {msg.messageType === 'system' ? (
                        <div className="text-center">
                          <span className="bg-white/10 px-3 py-1 rounded-full text-white/60 text-sm">
                            {msg.content}
                          </span>
                        </div>
                      ) : (
                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md ${
                            isCurrentUser 
                              ? 'bg-purple-600' 
                              : 'bg-white/10'
                          } rounded-lg p-3`}>
                            {!isCurrentUser && msg.userId && (
                              <div className="flex items-center space-x-2 mb-1">
                                {msg.userId.avatar ? (
                                  <img 
                                    src={msg.userId.avatar} 
                                    alt={msg.userId.name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                ) : (
                                  <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {msg.userId.name?.charAt(0) || 'U'}
                                  </div>
                                )}
                                <span className="text-white/80 text-sm font-medium">
                                  {msg.userId.name || 'Unknown User'}
                                </span>
                                {getLevelIcon(msg.userId.level || 1)}
                                <span className="text-white/60 text-xs">
                                  Lv.{msg.userId.level || 1}
                                </span>
                              </div>
                            )}
                            <p className="text-white">{msg.content}</p>
                            <p className="text-white/60 text-xs mt-1">
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-lg p-3 max-w-xs">
                      <p className="text-white/60 text-sm">
                        {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Active Users Sidebar */}
            <div className="w-64 border-l border-white/20 p-4">
              <h4 className="text-white font-medium mb-4">
                Active Users ({activeUsers.length})
              </h4>
              <div className="space-y-2">
                {activeUsers.map(activeUser => (
                  <div key={activeUser._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10">
                    {activeUser.avatar ? (
                      <img 
                        src={activeUser.avatar} 
                        alt={activeUser.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {activeUser.name?.charAt(0) || 'U'}
                      </div>
                    )}
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
      </div>

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