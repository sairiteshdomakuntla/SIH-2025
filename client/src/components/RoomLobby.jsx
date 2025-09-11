import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Crown, 
  CheckCircle, 
  Clock, 
  Car, 
  Play, 
  ArrowLeft,
  Gamepad2,
  Star,
  Trophy,
  Zap
} from 'lucide-react';
import AutoText from './AutoText';
import LoadingSpinner from './LoadingSpinner';
import { getRoom, setReady } from '../utils/roomApi';

const RoomLobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdatingReady, setIsUpdatingReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage or context
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT to get user info (basic decode, in production use proper JWT library)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ id: payload.userId, username: payload.username || payload.name });
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, []);

  // Fetch room data
  const fetchRoomData = async () => {
    try {
      const response = await getRoom(roomCode);
      if (response.success) {
        setRoom(response.room);
        
        // Navigate to quiz if room is active
        if (response.room.status === 'active') {
          navigate(`/quiz/${roomCode}`);
        }
      } else {
        setError(response.message || 'Failed to fetch room data');
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      if (err.response?.status === 404) {
        setError('Room not found');
      } else {
        setError('Failed to load room data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (roomCode) {
      fetchRoomData();
    }
  }, [roomCode]);

  // Polling every 2 seconds
  useEffect(() => {
    if (!roomCode) return;

    const interval = setInterval(() => {
      fetchRoomData();
    }, 2000);

    return () => clearInterval(interval);
  }, [roomCode]);

  // Handle ready toggle
  const handleReadyToggle = async () => {
    if (!currentUser || !room) return;

    const currentPlayer = room.players.find(p => p.userId === currentUser.id);
    if (!currentPlayer) return;

    setIsUpdatingReady(true);
    try {
      const response = await setReady(roomCode, !currentPlayer.ready);
      if (response.success) {
        setRoom(response.room);
      } else {
        setError(response.message || 'Failed to update ready status');
      }
    } catch (err) {
      console.error('Error updating ready status:', err);
      setError('Failed to update ready status');
    } finally {
      setIsUpdatingReady(false);
    }
  };

  const getCarIcon = (carType) => {
    switch (carType) {
      case 'sports': return '🏎️';
      case 'racing': return '🏁';
      case 'classic': return '🚗';
      default: return '🚙';
    }
  };

  const getCurrentPlayer = () => {
    if (!currentUser || !room) return null;
    return room.players.find(p => p.userId === currentUser.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            <AutoText>Oops! Something went wrong</AutoText>
          </h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl transition-colors"
          >
            <AutoText>Back to Dashboard</AutoText>
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const currentPlayer = getCurrentPlayer();
  const allPlayersReady = room.players.length > 0 && room.players.every(p => p.ready);
  const readyCount = room.players.filter(p => p.ready).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <Star className="w-2 h-2 text-purple-400 opacity-60" />
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <AutoText>Back to Dashboard</AutoText>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              <AutoText>Room Lobby</AutoText>
            </h1>
            <p className="text-gray-300 text-sm mt-1">Code: <span className="font-mono text-purple-300">{roomCode}</span></p>
          </div>
          
          <div className="w-24"></div>
        </div>

        {/* Room Info Card */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-600/50 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-xl mx-auto mb-2">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400">Players</p>
              <p className="text-xl font-bold text-white">{room.players.length}/{room.capacity}</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-green-600/20 rounded-xl mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">Ready</p>
              <p className="text-xl font-bold text-white">{readyCount}/{room.players.length}</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-purple-600/20 rounded-xl mx-auto mb-2">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">Subject</p>
              <p className="text-xl font-bold text-white">{room.subject || 'General'}</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-orange-600/20 rounded-xl mx-auto mb-2">
                <Zap className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-sm text-gray-400">Difficulty</p>
              <p className="text-xl font-bold text-white">{room.difficulty || 'Medium'}</p>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-600/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-400" />
            <AutoText>Players in Room</AutoText>
          </h2>
          
          <div className="space-y-3">
            {room.players.map((player, index) => (
              <div
                key={player.userId}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  player.ready
                    ? 'bg-green-500/20 border-green-500/40'
                    : 'bg-gray-700/50 border-gray-600/40'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {index === 0 && (
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-500/20 rounded-full">
                      <Crown className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                  
                  <div>
                    <p className="font-semibold text-white">
                      {player.username}
                      {player.userId === currentUser?.id && (
                        <span className="text-purple-400 text-sm ml-2">(You)</span>
                      )}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <Car className="w-3 h-3" />
                      <span>{getCarIcon(player.car)} {player.car}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {player.ready ? (
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Ready</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Waiting</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready Button */}
        {currentPlayer && (
          <div className="text-center">
            <button
              onClick={handleReadyToggle}
              disabled={isUpdatingReady}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg ${
                currentPlayer.ready
                  ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white'
              } ${isUpdatingReady ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdatingReady ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <AutoText>Updating...</AutoText>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {currentPlayer.ready ? (
                    <>
                      <Clock className="w-5 h-5" />
                      <AutoText>Not Ready</AutoText>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <AutoText>Ready Up!</AutoText>
                    </>
                  )}
                </div>
              )}
            </button>
            
            {allPlayersReady && room.players.length > 1 && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/40 rounded-xl">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <Play className="w-5 h-5" />
                  <AutoText>All players ready! Starting quiz...</AutoText>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;