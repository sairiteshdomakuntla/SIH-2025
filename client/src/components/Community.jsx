import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Users, Trophy, Plus, Video } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import RoomList from './RoomList';
import ChatRoom from './ChatRoom';
import CreateRoomModal from './CreateRoomModal';
import Leaderboard from './Leaderboard';

const Community = () => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userGrade, setUserGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  
  const { connected, connectionError } = useSocket();
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
          <div className="mt-4 flex justify-center">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">
                {connected ? 'Connected' : connectionError || 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 flex justify-center space-x-6 text-white/60">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Real-time Chat</span>
            </div>
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span className="text-sm">Video Calls</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Study Groups</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 flex space-x-1">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'rooms'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Rooms</span>
            </button>
            
            {selectedRoom && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>{selectedRoom.name}</span>
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {activeTab === 'rooms' && (
            <>
              <RoomList 
                rooms={rooms} 
                onRoomSelect={handleRoomSelect}
                onRefresh={fetchRooms}
              />
              
              {/* Create Room Button */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                  <button
                    onClick={() => setCreateRoomModalOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Room</span>
                  </button>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'chat' && selectedRoom && (
            <div className="lg:col-span-5">
              <ChatRoom 
                room={selectedRoom} 
                onBack={() => setActiveTab('rooms')}
              />
            </div>
          )}
          
          {activeTab === 'leaderboard' && (
            <div className="lg:col-span-5">
              <Leaderboard 
                leaderboard={leaderboard}
                userGrade={userGrade}
                currentUser={user}
              />
            </div>
          )}
        </div>

        {/* Create Room Modal */}
        <CreateRoomModal
          isOpen={createRoomModalOpen}
          onClose={() => setCreateRoomModalOpen(false)}
          onRoomCreated={handleRoomCreated}
        />

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-white">Loading community...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300 max-w-md">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-200 hover:text-red-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;