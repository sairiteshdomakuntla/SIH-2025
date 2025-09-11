import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { 
  MessageCircle, Users, Trophy, Send, Smile, 
  Hash, Crown, Star, Zap, UserPlus, UserMinus, Plus 
} from 'lucide-react';
import ChatRoom from './ChatRoom';
import RoomList from './RoomList';
import CreateRoomModal from './CreateRoomModal';

const Community = () => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userGrade, setUserGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { connected, currentRoom } = useSocket();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Get backend URL with fallback
  const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  };

  // Check for room join parameter
  useEffect(() => {
    const joinRoomId = searchParams.get('join');
    if (joinRoomId && rooms.length > 0) {
      const roomToJoin = rooms.find(room => room.roomId === joinRoomId);
      if (roomToJoin) {
        handleRoomSelect(roomToJoin);
      }
    }
  }, [searchParams, rooms]);

  useEffect(() => {
    fetchRooms();
    fetchLeaderboard();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const backendUrl = getBackendUrl();
      console.log('Fetching rooms from:', `${backendUrl}/api/community/rooms`);
      
      const response = await fetch(`${backendUrl}/api/community/rooms`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Rooms response:', data);
      
      if (data.success) {
        setRooms(data.rooms || []);
      } else {
        setError(data.message || 'Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError(`Failed to fetch rooms: ${error.message}`);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const backendUrl = getBackendUrl();
      console.log('Fetching leaderboard from:', `${backendUrl}/api/community/leaderboard`);
      
      const response = await fetch(`${backendUrl}/api/community/leaderboard`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Leaderboard response:', data);
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setUserGrade(data.userGrade);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setActiveTab('chat');
  };

  const handleRoomCreated = (newRoom) => {
    // Add the new room to the list
    setRooms(prev => [newRoom, ...prev]);
    // Automatically select and join the new room
    handleRoomSelect(newRoom);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Learning Community
          </h1>
          <p className="text-white/80 text-lg">
            Connect, learn, and grow with fellow students
          </p>
          
          {/* Connection Status */}
          <div className={`inline-flex items-center mt-4 px-4 py-2 rounded-full ${
            connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            {connected ? 'Connected' : 'Disconnected'}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex space-x-1">
            {[
              { key: 'rooms', label: 'Chat Rooms', icon: Hash },
              { key: 'chat', label: 'Active Chat', icon: MessageCircle },
              { key: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {activeTab === 'rooms' && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Create Room</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {activeTab === 'rooms' && (
            <RoomList 
              rooms={rooms} 
              onRoomSelect={handleRoomSelect}
              onRefresh={fetchRooms}
              loading={loading}
              error={error}
            />
          )}
          
          {activeTab === 'chat' && selectedRoom && (
            <ChatRoom 
              room={selectedRoom}
              onBack={() => setActiveTab('rooms')}
            />
          )}
          
          {activeTab === 'leaderboard' && (
            <div className="lg:col-span-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    🏆 Class Leaderboard
                  </h2>
                  {userGrade && (
                    <div className="inline-flex items-center space-x-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2">
                      <Trophy className="w-4 h-4 text-purple-300" />
                      <span className="text-purple-200 font-medium">Grade {userGrade} Competition</span>
                    </div>
                  )}
                </div>
                {leaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {leaderboard.map((player, index) => (
                      <div 
                        key={player._id}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                          index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                          index === 1 ? 'bg-gray-400/20 border border-gray-400/30' :
                          index === 2 ? 'bg-orange-500/20 border border-orange-500/30' :
                          'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-yellow-900' :
                            index === 1 ? 'bg-gray-400 text-gray-900' :
                            index === 2 ? 'bg-orange-500 text-orange-900' :
                            'bg-purple-600 text-white'
                          }`}>
                            {index < 3 ? (
                              index === 0 ? <Crown className="w-5 h-5" /> :
                              index === 1 ? <Star className="w-5 h-5" /> :
                              <Zap className="w-5 h-5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {player.avatar ? (
                              <img 
                                src={player.avatar} 
                                alt={player.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                {player.name?.charAt(0) || 'U'}
                              </div>
                            )}
                            
                            <div>
                              <p className="text-white font-medium">{player.name || 'Unknown'}</p>
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-white/60">Level {player.level || 0}</span>
                                {player.grade && (
                                  <>
                                    <span className="text-white/40">•</span>
                                    <span className="text-purple-300">Grade {player.grade}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white font-bold">{player.points || 0} XP</p>
                          <p className="text-white/60 text-sm">{player.completedQuizzes || 0} quizzes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-2">No leaderboard data available</p>
                    {userGrade && (
                      <p className="text-white/40 text-sm">
                        Complete quizzes and activities to compete with your Grade {userGrade} classmates!
                      </p>
                    )}
                  </div>
                )}
                
                {leaderboard.length > 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-white/50 text-sm">
                      🎯 Compete with students from your grade level • Complete quizzes and activities to earn XP!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
};

export default Community;