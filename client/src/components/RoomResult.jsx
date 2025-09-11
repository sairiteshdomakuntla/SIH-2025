import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Star, 
  Crown, 
  Clock, 
  Target, 
  Users,
  ArrowLeft,
  Medal,
  Zap
} from 'lucide-react';
import AutoText from './AutoText';
import LoadingSpinner from './LoadingSpinner';
import { getRoom } from '../utils/roomApi';

const RoomResult = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ id: payload.userId, username: payload.username || payload.name });
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, []);

  // Fetch room results
  useEffect(() => {
    const fetchRoomResults = async () => {
      try {
        const response = await getRoom(roomCode);
        if (response.success) {
          setRoom(response.room);
        } else {
          setError(response.message || 'Failed to fetch room results');
        }
      } catch (err) {
        console.error('Error fetching room results:', err);
        setError('Failed to load room results');
      } finally {
        setLoading(false);
      }
    };

    if (roomCode) {
      fetchRoomResults();
    }
  }, [roomCode]);

  const getRankPosition = (playerId) => {
    if (!room || !room.players) return 0;
    
    const sortedPlayers = [...room.players].sort((a, b) => {
      if (b.score === a.score) {
        return a.timeTaken - b.timeTaken; // Faster time wins if score is same
      }
      return b.score - a.score; // Higher score wins
    });
    
    return sortedPlayers.findIndex(p => p.userId === playerId) + 1;
  };

  const getSortedPlayers = () => {
    if (!room || !room.players) return [];
    
    return [...room.players].sort((a, b) => {
      if (b.score === a.score) {
        return a.timeTaken - b.timeTaken;
      }
      return b.score - a.score;
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-orange-400" />;
      default: return <Target className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1: return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/40';
      case 2: return 'from-gray-500/20 to-gray-600/20 border-gray-500/40';
      case 3: return 'from-orange-500/20 to-orange-600/20 border-orange-500/40';
      default: return 'from-gray-700/20 to-gray-800/20 border-gray-600/40';
    }
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
            <AutoText>Error Loading Results</AutoText>
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

  if (!room || room.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            <AutoText>Quiz Not Completed</AutoText>
          </h2>
          <p className="text-yellow-200 mb-6">This quiz hasn't been completed yet.</p>
          <button
            onClick={() => navigate(`/room/${roomCode}`)}
            className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl transition-colors"
          >
            <AutoText>Back to Room</AutoText>
          </button>
        </div>
      </div>
    );
  }

  const sortedPlayers = getSortedPlayers();
  const currentPlayerRank = currentUser ? getRankPosition(currentUser.id) : 0;
  const winner = room.players.find(p => p.userId.toString() === room.winner?.toString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      {/* Animated background */}
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
              <AutoText>Quiz Results</AutoText>
            </h1>
            <p className="text-gray-300 text-sm">Room: {roomCode}</p>
          </div>
          
          <div className="w-32"></div>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/40 rounded-2xl p-8 mb-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">
              <AutoText>🎉 Congratulations! 🎉</AutoText>
            </h2>
            <p className="text-yellow-200 text-xl">
              <AutoText>{winner.username} wins with {winner.score}% score!</AutoText>
            </p>
          </div>
        )}

        {/* Player Rankings */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-600/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-400" />
            <AutoText>Final Rankings</AutoText>
          </h2>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => {
              const position = index + 1;
              const isCurrentUser = currentUser && player.userId === currentUser.id;
              
              return (
                <div
                  key={player.userId}
                  className={`bg-gradient-to-r ${getRankColor(position)} border rounded-xl p-6 ${
                    isCurrentUser ? 'ring-2 ring-purple-500/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-800/50 rounded-xl">
                        {getRankIcon(position)}
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center">
                          {player.username}
                          {isCurrentUser && (
                            <span className="text-purple-400 text-sm ml-2">(You)</span>
                          )}
                          {position === 1 && (
                            <Crown className="w-5 h-5 text-yellow-400 ml-2" />
                          )}
                        </h3>
                        <p className="text-gray-300">
                          Position #{position}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="flex items-center space-x-1 text-green-400">
                            <Target className="w-4 h-4" />
                            <span className="text-2xl font-bold">{player.score}%</span>
                          </div>
                          <p className="text-xs text-gray-400">Score</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center space-x-1 text-blue-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-lg font-semibold">{formatTime(player.timeTaken)}</span>
                          </div>
                          <p className="text-xs text-gray-400">Time</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your Performance Summary */}
        {currentUser && (
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-400" />
              <AutoText>Your Performance</AutoText>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-600/20 rounded-xl">
                <div className="text-3xl font-bold text-purple-300 mb-1">#{currentPlayerRank}</div>
                <p className="text-sm text-gray-300">Final Rank</p>
              </div>
              
              <div className="text-center p-4 bg-green-600/20 rounded-xl">
                <div className="text-3xl font-bold text-green-300 mb-1">
                  {sortedPlayers.find(p => p.userId === currentUser.id)?.score || 0}%
                </div>
                <p className="text-sm text-gray-300">Your Score</p>
              </div>
              
              <div className="text-center p-4 bg-blue-600/20 rounded-xl">
                <div className="text-3xl font-bold text-blue-300 mb-1">
                  {formatTime(sortedPlayers.find(p => p.userId === currentUser.id)?.timeTaken || 0)}
                </div>
                <p className="text-sm text-gray-300">Your Time</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomResult;