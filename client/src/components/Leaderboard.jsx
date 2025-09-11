import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Award, Star, Medal, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/xp/leaderboard?limit=10`, {
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
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  const getLevelBadgeColor = (level) => {
    if (level >= 10) return 'bg-purple-100 text-purple-800';
    if (level >= 7) return 'bg-yellow-100 text-yellow-800';
    if (level >= 5) return 'bg-gray-100 text-gray-800';
    if (level >= 3) return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">Error loading leaderboard: {error}</p>
        <button 
          onClick={fetchLeaderboard}
          className="mt-2 text-red-800 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Weekly Leaderboard</h2>
        </div>
        <p className="text-blue-100 text-sm mt-1">Top learners this week</p>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-200">
        {leaderboard.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No leaderboard data available</p>
          </div>
        ) : (
          leaderboard.map((entry) => (
            <div
              key={entry.user.id}
              className={`p-4 ${getPositionStyle(entry.position)} ${
                entry.position <= 3 ? 'shadow-sm' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Position */}
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold text-lg ${
                      entry.position <= 3 ? 'text-current' : 'text-gray-600'
                    }`}>
                      #{entry.position}
                    </span>
                    {getPositionIcon(entry.position)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {entry.user.avatar ? (
                        <img
                          src={entry.user.avatar}
                          alt={entry.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {entry.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <p className={`font-medium ${
                        entry.position <= 3 ? 'text-current' : 'text-gray-900'
                      }`}>
                        {entry.user.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.position <= 3 
                            ? 'bg-white bg-opacity-20 text-current' 
                            : getLevelBadgeColor(entry.level)
                        }`}>
                          Level {entry.level}
                        </span>
                        {entry.streak > 0 && (
                          <span className={`text-xs ${
                            entry.position <= 3 ? 'text-current opacity-75' : 'text-orange-600'
                          }`}>
                            🔥 {entry.streak} day streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* XP and Badges */}
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    entry.position <= 3 ? 'text-current' : 'text-gray-900'
                  }`}>
                    {entry.xp.toLocaleString()}
                  </p>
                  <p className={`text-sm ${
                    entry.position <= 3 ? 'text-current opacity-75' : 'text-gray-500'
                  }`}>
                    XP
                  </p>
                  {entry.badgeCount > 0 && (
                    <p className={`text-xs ${
                      entry.position <= 3 ? 'text-current opacity-75' : 'text-purple-600'
                    }`}>
                      🏆 {entry.badgeCount} badges
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 text-center">
        <p className="text-xs text-gray-500">
          Leaderboard updates weekly. Keep learning to climb the ranks! 🚀
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;