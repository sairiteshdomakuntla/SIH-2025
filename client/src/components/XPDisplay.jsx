import React, { useState, useEffect } from 'react';
import { Star, Trophy, Zap, Crown, TrendingUp, Award, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const XPDisplay = ({ userId, showDetails = true }) => {
  const [xpInfo, setXpInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchXPInfo();
  }, [userId]);

  const fetchXPInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = userId ? `/api/xp/user/${userId}` : '/api/xp/user';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch XP information');
      }

      const data = await response.json();
      setXpInfo(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching XP info:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    if (level >= 10) return 'from-purple-600 to-pink-600';
    if (level >= 7) return 'from-yellow-500 to-orange-500';
    if (level >= 5) return 'from-gray-400 to-gray-600';
    if (level >= 3) return 'from-amber-500 to-yellow-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getLevelIcon = (level) => {
    if (level >= 10) return <Crown className="w-6 h-6" />;
    if (level >= 7) return <Trophy className="w-6 h-6" />;
    if (level >= 5) return <Award className="w-6 h-6" />;
    if (level >= 3) return <Star className="w-6 h-6" />;
    return <Zap className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-6 shadow-2xl animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-2/3 mb-2"></div>
        <div className="h-2 bg-white/20 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/40 rounded-3xl p-6 shadow-2xl">
        <p className="text-red-200 text-sm">Error loading XP: {error}</p>
      </div>
    );
  }

  if (!xpInfo) {
    return (
      <div className="backdrop-blur-xl bg-black/40 border border-gray-500/30 rounded-3xl p-6 shadow-2xl">
        <p className="text-gray-300 text-sm">No XP information available</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
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
            <Sparkles className="w-2 h-2 text-purple-400 opacity-40" />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className={`p-6 bg-gradient-to-r ${getLevelColor(xpInfo.level)} relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full shadow-lg backdrop-blur-sm">
              {getLevelIcon(xpInfo.level)}
            </div>
            <div>
              <h3 className="font-bold text-2xl text-white">Level {xpInfo.level}</h3>
              <p className="text-white/90 text-sm font-medium">{xpInfo.unlock}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="w-5 h-5 text-white" />
              <p className="font-bold text-2xl text-white">{xpInfo.currentXP.toLocaleString()}</p>
            </div>
            <p className="text-white/80 text-sm">Total XP</p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/90 font-medium">Progress to Level {xpInfo.level + 1}</span>
          <span className="text-purple-300 font-bold">{xpInfo.progress}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative mb-4">
          <div className="w-full bg-white/10 rounded-full h-4 border border-white/20">
            <div 
              className={`bg-gradient-to-r ${getLevelColor(xpInfo.level)} h-full rounded-full transition-all duration-700 ease-out shadow-lg`}
              style={{ width: `${xpInfo.progress}%` }}
            >
              <div className="w-full h-full bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-purple-500 transition-all duration-700"
            style={{ left: `${xpInfo.progress}%`, marginLeft: '-6px' }}
          >
            <div className="w-full h-full bg-purple-400 rounded-full animate-ping"></div>
          </div>
        </div>
        
        {xpInfo.xpToNext > 0 && (
          <p className="text-purple-200 text-sm text-center">
            🎯 {xpInfo.xpToNext.toLocaleString()} XP to next level
          </p>
        )}
      </div>

      {showDetails && (
        <div className="px-6 pb-6 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            {/* Current Streak */}
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-2xl p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{xpInfo.currentStreak}</p>
              <p className="text-orange-200 text-sm font-medium">Current Streak</p>
            </div>

            {/* Badge Count */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-2xl p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{xpInfo.badges?.length || 0}</p>
              <p className="text-purple-200 text-sm font-medium">Badges Earned</p>
            </div>
          </div>

          {/* Next Unlock */}
          {xpInfo.nextUnlock && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-blue-200 text-sm font-medium">Next Unlock</p>
                  <p className="text-white font-semibold">{xpInfo.nextUnlock}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XPDisplay;