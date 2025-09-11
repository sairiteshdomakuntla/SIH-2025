import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Award, Star, Medal, TrendingUp, Users, Zap, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AutoText from './AutoText';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/xp/leaderboard?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-500" />;
      default:
        return <Star className="w-5 h-5 text-blue-400" />;
    }
  };

  const getPositionGradient = (position) => {
    switch (position) {
      case 1:
        return 'from-yellow-500 to-orange-500';
      case 2:
        return 'from-gray-400 to-gray-600';
      case 3:
        return 'from-amber-500 to-yellow-500';
      default:
        return 'from-purple-500/30 to-blue-500/30';
    }
  };

  const getLevelBadgeColor = (level) => {
    if (level >= 10) return 'from-purple-500 to-pink-500';
    if (level >= 7) return 'from-yellow-500 to-orange-500';
    if (level >= 5) return 'from-gray-400 to-gray-600';
    if (level >= 3) return 'from-amber-500 to-yellow-500';
    return 'from-blue-500 to-cyan-500';
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 relative">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
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

        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl w-full max-w-4xl">
          <div className="h-8 bg-white/20 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl animate-pulse">
                <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-white/20 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/40 rounded-3xl p-8 shadow-2xl text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-red-400 opacity-50" />
          <p className="text-red-200 text-lg mb-4">Error loading leaderboard: {error}</p>
          <button 
            onClick={fetchLeaderboard}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
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
            <Sparkles className="w-2 h-2 text-purple-400 opacity-60" />
          </div>
        ))}
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  <AutoText>Weekly Leaderboard</AutoText>
                </h1>
                <p className="text-white/80 text-lg">
                  <AutoText>Top learners competing this week</AutoText>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <AutoText>Back to Dashboard</AutoText>
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-20 h-20 mx-auto mb-4 text-purple-400 opacity-50" />
              <h3 className="text-2xl font-bold text-white mb-2">
                <AutoText>No Competition Data</AutoText>
              </h3>
              <p className="text-white/70">
                <AutoText>Complete some challenges to see the leaderboard!</AutoText>
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.user.id}
                  className={`p-6 transition-all duration-300 hover:bg-white/5 ${
                    entry.position <= 3 ? `bg-gradient-to-r ${getPositionGradient(entry.position)}/20` : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Position */}
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          entry.position <= 3 
                            ? `bg-gradient-to-r ${getPositionGradient(entry.position)} shadow-lg` 
                            : 'bg-white/10 border border-white/20'
                        }`}>
                          <span className={`font-bold text-lg ${
                            entry.position <= 3 ? 'text-white' : 'text-white/80'
                          }`}>
                            #{entry.position}
                          </span>
                        </div>
                        {getPositionIcon(entry.position)}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                          {entry.user.avatar ? (
                            <img
                              src={entry.user.avatar}
                              alt={entry.user.name}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {entry.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-xl text-white">
                            {entry.user.name}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r ${getLevelBadgeColor(entry.level)} text-white shadow-lg`}>
                              Level {entry.level}
                            </span>
                            {entry.streak > 0 && (
                              <span className="flex items-center space-x-1 text-orange-300">
                                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">{entry.streak} day streak</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <p className="font-bold text-2xl text-white">
                          {entry.xp.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-white/70 text-sm">Total XP</p>
                      {entry.badgeCount > 0 && (
                        <div className="flex items-center justify-end space-x-1 mt-2">
                          <Award className="w-4 h-4 text-purple-400" />
                          <p className="text-purple-300 text-sm font-medium">
                            {entry.badgeCount} badges
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-t border-white/10 px-6 py-4 text-center">
            <p className="text-white/80 text-sm">
              <AutoText>Leaderboard updates weekly. Keep learning to climb the ranks!</AutoText> 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;