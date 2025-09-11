import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Bot, User, Sparkles, Star, Zap, Trophy, 
  MessageCircle, Loader, Play, Download, Gamepad2,
  Brain, Video, Type, History, Clock, Trash2, Eye, ExternalLink
} from 'lucide-react';
import AutoText from './AutoText';
import { api, animationApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const LearnViaAnimations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseType, setResponseType] = useState('both'); // 'text', 'animation', 'both'
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const textareaRef = useRef(null);

  // Generate session ID when component mounts
  useEffect(() => {
    setCurrentSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

    // Fetch chat history when user is available
  useEffect(() => {
    if (user && user._id && showHistory) {
      fetchChatHistory();
    }
  }, [user, showHistory]);

  const fetchChatHistory = async () => {
    if (!user || !user._id) {
      console.log('fetchChatHistory: No user or user._id', { user, userId: user?._id });
      return;
    }
    
    console.log('Fetching chat history for user ID:', user._id);
    setHistoryLoading(true);
    try {
      const response = await api.get(`/api/gemini/history/${user._id}`);
      console.log('Chat history response:', response.data);
      if (response.data.success) {
        setChatHistory(response.data.chats);
        console.log('Set chat history:', response.data.chats);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadChatSession = async (sessionId) => {
    if (!user || !user._id) return;
    
    try {
      const response = await api.get(`/api/gemini/history/${user._id}/${sessionId}`);
      if (response.data.success) {
        setMessages(response.data.chat.messages);
        setCurrentSessionId(sessionId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const deleteChatSession = async (sessionId) => {
    if (!user || !user._id) return;
    
    try {
      await api.delete(`/api/gemini/history/${user._id}/${sessionId}`);
      setChatHistory(prev => prev.filter(chat => chat.sessionId !== sessionId));
      
      // If we deleted the current session, clear messages
      if (sessionId === currentSessionId) {
        setMessages([]);
        setCurrentSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    setShowHistory(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate unique IDs for this request
      const baseId = Date.now();
      const textMessageId = `${baseId}_text`;
      const animationMessageId = `${baseId}_animation`;
      
      // Handle text and animation requests separately for better UX
      
      // Get text response from Gemini API (show immediately)
      if (responseType === 'text' || responseType === 'both') {
        try {
          const requestData = {
            message: inputMessage.trim()
          };
          
          // Only include user data if user is properly authenticated
          if (user && user._id && currentSessionId) {
            requestData.userId = user._id;
            requestData.sessionId = currentSessionId;
          }
          
          const textResponse = await api.post('/api/gemini/chat', requestData);

          if (textResponse.data && textResponse.data.success) {
            console.log('Received related simulations:', textResponse.data.relatedSimulations);
            const textMessage = {
              id: textMessageId,
              type: 'bot-text',
              content: textResponse.data.response,
              relatedSimulations: textResponse.data.relatedSimulations || [],
              timestamp: new Date()
            };
            setMessages(prev => [...prev, textMessage]);
          }
        } catch (error) {
          console.error('Error fetching text response:', error);
          let errorMessage = 'Sorry, I couldn\'t generate a text response right now. Please try again.';
          
          if (error.code === 'ECONNABORTED') {
            errorMessage = 'The request took too long to process. Please try a shorter or simpler question.';
          } else if (error.code === 'ERR_NETWORK') {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          
          const errorMessage_obj = {
            id: textMessageId,
            type: 'bot-text',
            content: errorMessage,
            timestamp: new Date(),
            error: true
          };
          setMessages(prev => [...prev, errorMessage_obj]);
        }
      }

      // Get animation response separately (don't block text response)
      if (responseType === 'animation' || responseType === 'both') {
        // Add loading message for animation
        const loadingMessage = {
          id: animationMessageId,
          type: 'bot-animation',
          content: null,
          loading: true,
          prompt: inputMessage.trim(),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, loadingMessage]);

        // Fetch animation in background
        animationApi.post('/api/gemini/generate-animation', {
          prompt: inputMessage.trim()
        }).then(animationResponse => {
          console.log('Animation response received:', animationResponse.data);
          if (animationResponse.data && animationResponse.data.success) {
            const animationMessage = {
              id: animationMessageId,
              type: 'bot-animation',
              content: animationResponse.data.video_url,
              prompt: inputMessage.trim(),
              timestamp: new Date(),
              message: animationResponse.data.message
            };
            
            // Replace loading message with actual animation
            setMessages(prev => prev.map(msg => 
              msg.id === animationMessageId ? animationMessage : msg
            ));
          } else {
            console.error('Animation response missing success flag or data:', animationResponse.data);
            const errorAnimationMessage = {
              id: animationMessageId,
              type: 'bot-animation',
              content: null,
              error: 'Animation response was invalid. Please try again.',
              timestamp: new Date()
            };
            
            setMessages(prev => prev.map(msg => 
              msg.id === animationMessageId ? errorAnimationMessage : msg
            ));
          }
        }).catch(error => {
          console.error('Error fetching animation response:', error);
          
          let errorMessage = 'Failed to generate animation. Please try again.';
          
          if (error.code === 'ECONNABORTED') {
            errorMessage = 'Animation generation timed out (took more than 3 minutes). Please try a simpler prompt or try again later.';
          } else if (error.code === 'ERR_NETWORK') {
            errorMessage = 'Network error while generating animation. Please check your connection and try again.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 503) {
            errorMessage = 'Animation service is temporarily unavailable. Please try again in a few minutes.';
          }
          
          const errorAnimationMessage = {
            id: animationMessageId,
            type: 'bot-animation',
            content: null,
            error: errorMessage,
            timestamp: new Date()
          };
          
          // Replace loading message with error
          setMessages(prev => prev.map(msg => 
            msg.id === animationMessageId ? errorAnimationMessage : msg
          ));
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 3,
        type: 'bot-text',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex items-start space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* Avatar */}
          <div className={`p-3 rounded-full ${
            isUser 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
              : message.type === 'bot-animation'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
              : 'bg-gradient-to-r from-green-600 to-emerald-600'
          } shadow-lg`}>
            {isUser ? (
              <User className="w-5 h-5 text-white" />
            ) : message.type === 'bot-animation' ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <Brain className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Message Content */}
          <div className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl ${
            isUser
              ? 'bg-purple-600/20 border-purple-500/30 text-white'
              : message.error
              ? 'bg-red-500/20 border-red-500/30 text-red-200'
              : 'bg-gray-800/40 border-gray-600/30 text-white'
          }`}>
            {message.type === 'bot-animation' && message.loading ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-cyan-300 mb-3">
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-medium">Generating Animation...</span>
                </div>
                <div className="flex items-center justify-center p-8 border border-cyan-500/30 rounded-2xl bg-cyan-500/5">
                  <div className="text-center space-y-3">
                    <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                    <p className="text-cyan-300 text-sm">Creating your animated visualization...</p>
                    <p className="text-cyan-400/70 text-xs">This may take 1-2 minutes</p>
                  </div>
                </div>
              </div>
            ) : message.type === 'bot-animation' && message.content ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-cyan-300 mb-3">
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-medium">Animation Response</span>
                </div>
                {message.message && (
                  <p className="text-cyan-200 text-sm mb-3 italic">"{message.message}"</p>
                )}
                <video 
                  controls 
                  className="w-full max-w-lg rounded-2xl border border-cyan-500/30"
                  poster="/api/placeholder/400/300"
                >
                  <source src={message.content} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="flex space-x-2">
                  <button className="flex items-center space-x-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-xl px-3 py-2 text-cyan-300 hover:text-cyan-200 transition-all duration-200">
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Play</span>
                  </button>
                  <a 
                    href={message.content} 
                    download
                    className="flex items-center space-x-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-xl px-3 py-2 text-purple-300 hover:text-purple-200 transition-all duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </a>
                </div>
              </div>
            ) : message.type === 'bot-animation' && message.error ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-red-300 mb-2">
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-medium">Animation Error</span>
                </div>
                <p className="text-red-200">{message.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!isUser && (
                  <div className="flex items-center space-x-2 text-green-300 mb-2">
                    <Type className="w-4 h-4" />
                    <span className="text-sm font-medium">Text Response</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                
                {/* Related Simulations */}
                {!isUser && message.relatedSimulations && message.relatedSimulations.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-2 text-purple-300">
                      <Gamepad2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Related Simulations</span>
                    </div>
                    <div className="space-y-2">
                      {message.relatedSimulations.map((simulation, index) => (
                        <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 hover:bg-purple-500/20 transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-purple-200 text-sm">{simulation.title}</h4>
                              <p className="text-xs text-purple-300/70 mt-1">{simulation.subject} • {simulation.category}</p>
                              {simulation.description && (
                                <p className="text-xs text-white/60 mt-1 line-clamp-2">{simulation.description}</p>
                              )}
                            </div>
                            <div className="ml-3 flex flex-col gap-2">
                              <a
                                href={simulation.iframeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-lg px-3 py-1 text-xs text-purple-200 hover:text-white transition-all duration-200 flex items-center space-x-1"
                              >
                                <Play className="w-3 h-3" />
                                <span>Try It</span>
                              </a>
                              {simulation.slug && (
                                <button
                                  onClick={() => window.open(`/simulation/${simulation.slug}`, '_blank')}
                                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1 text-xs text-white/70 hover:text-white transition-all duration-200 flex items-center space-x-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Details</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Timestamp */}
            <div className="mt-3 text-xs opacity-60">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <Star className="w-1 h-1 text-pink-400 opacity-60" />
          </div>
        ))}
        
        {/* Floating Orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full blur-xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${50 + Math.random() * 100}px`,
              height: `${50 + Math.random() * 100}px`,
              background: `radial-gradient(circle, ${
                i % 3 === 0 ? 'rgba(147, 51, 234, 0.1)' :
                i % 3 === 1 ? 'rgba(236, 72, 153, 0.1)' : 'rgba(147, 51, 234, 0.1)'
              } 0%, transparent 70%)`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-900/10 to-pink-900/10" />
      </div>

      {/* History Controls - Left Side */}
      {user && user._id && (
        <div className="absolute top-6 left-6 z-30">
          <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-2xl p-2 shadow-2xl">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 text-white/70 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4" />
                  <span>History</span>
                </div>
              </button>
              <button
                onClick={startNewChat}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 text-white/70 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>New</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Type Selector - Right Side */}
      <div className="absolute top-6 right-6 z-30">
        {/* Response Type Selector */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-2xl p-2 shadow-2xl">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setResponseType('text')}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                responseType === 'text'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4" />
                <span>Text</span>
              </div>
            </button>
            <button
              onClick={() => setResponseType('animation')}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                responseType === 'animation'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span>Animation</span>
              </div>
            </button>
            <button
              onClick={() => setResponseType('both')}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                responseType === 'both'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Magic</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && user && user._id && (
        <div className="absolute top-0 left-0 h-full w-96 bg-black/40 backdrop-blur-xl border-r border-purple-500/30 z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Chat History</span>
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Sidebar Controls */}
            <div className="flex items-center space-x-2 mb-6">
              <button
                onClick={startNewChat}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 rounded-xl px-4 py-2 text-white/80 hover:text-white transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                <span>New Chat</span>
              </button>
              <button
                onClick={fetchChatHistory}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/30 rounded-xl px-4 py-2 text-white/80 hover:text-white transition-all duration-200"
              >
                <Clock className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-white animate-spin" />
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No chat history yet</p>
                <p className="text-sm">Start a conversation to see it here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((chat) => (
                  <div key={chat.sessionId} className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer" onClick={() => loadChatSession(chat.sessionId)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-white/60" />
                          <span className="text-sm text-white/60">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white text-sm truncate">
                          {chat.messages[0]?.content || 'Empty conversation'}
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                          {chat.messages.length} messages
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatSession(chat.sessionId);
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-white/70 hover:text-red-300 transition-colors"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6 relative z-10 pt-24 transition-all duration-300 ${showHistory && user && user._id ? 'ml-96' : ''}`}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-8 max-w-2xl px-8">

              {/* Welcome Text */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <AutoText 
                    tag="h1"
                    className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent leading-tight"
                  >
                    AI Learning
                  </AutoText>
                  <AutoText 
                    tag="h2"
                    className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
                  >
                    Assistant
                  </AutoText>
                </div>
                
                <AutoText 
                  tag="p"
                  className="text-xl text-white/80 leading-relaxed max-w-xl mx-auto"
                >
                  Ask me anything about math, science, history, or any subject. I'll provide detailed explanations and create stunning animated visualizations to help you learn!
                </AutoText>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-3 rounded-xl w-fit mb-3">
                      <Type className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Smart Explanations</h3>
                    <p className="text-white/60 text-sm">Get detailed, easy-to-understand explanations powered by advanced AI</p>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-3 rounded-xl w-fit mb-3">
                      <Video className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Animated Learning</h3>
                    <p className="text-white/60 text-sm">Watch concepts come to life with custom animations and visualizations</p>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-3 rounded-xl w-fit mb-3">
                      <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Adaptive Learning</h3>
                    <p className="text-white/60 text-sm">Personalized content that adapts to your learning style and pace</p>
                  </div>
                </div>

                {/* Quick Start Examples */}
                <div className="mt-8">
                  <p className="text-white/60 text-sm mb-4">Try asking me about:</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {[
                      "How does photosynthesis work?",
                      "Explain quadratic equations",
                      "What is quantum physics?",
                      "How do black holes form?"
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(example)}
                        className="backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 hover:text-white text-sm transition-all duration-300 transform hover:scale-105"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="flex items-start space-x-3 max-w-3xl">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-3 rounded-full shadow-lg animate-pulse">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-600/30 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center space-x-3">
                      <Loader className="w-5 h-5 text-purple-400 animate-spin" />
                      <AutoText className="text-white/80">
                        {responseType === 'both' ? 'Generating text explanation and creating animation (this may take 1-2 minutes)...' :
                         responseType === 'animation' ? 'Creating your animation (this may take 1-2 minutes)...' :
                         'Thinking and generating response...'}
                      </AutoText>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Input Form */}
      <div className={`fixed bottom-0 left-0 right-0 p-6 z-20 transition-all duration-300 ${showHistory && user && user._id ? 'ml-96' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-2 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="w-full bg-transparent border-0 rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none resize-none min-h-[60px] max-h-32 text-lg"
                    rows="1"
                    disabled={isLoading}
                    style={{ 
                      height: 'auto',
                      minHeight: '60px'
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                    }}
                  />
                  
                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-all duration-500 pointer-events-none" />
                  
                  {/* Floating Sparkles */}
                  {inputMessage && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white p-4 rounded-2xl transition-all duration-500 transform hover:scale-110 disabled:scale-100 shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden group"
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  
                  {/* Button Content */}
                  <div className="relative flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader className="w-6 h-6 animate-spin" />
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LearnViaAnimations;