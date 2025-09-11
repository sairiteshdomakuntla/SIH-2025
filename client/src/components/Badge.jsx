import React from 'react';
import { Trophy, Star, Zap, Target, Clock, BookOpen } from 'lucide-react';

const Badge = ({ badge, size = 'md', showProgress = false }) => {
  const getColorClasses = (color, isEarned) => {
    const baseColors = {
      blue: isEarned ? 'from-blue-500 to-blue-600 border-blue-400' : 'from-gray-600 to-gray-700 border-gray-500',
      green: isEarned ? 'from-green-500 to-green-600 border-green-400' : 'from-gray-600 to-gray-700 border-gray-500',
      purple: isEarned ? 'from-purple-500 to-purple-600 border-purple-400' : 'from-gray-600 to-gray-700 border-gray-500',
      orange: isEarned ? 'from-orange-500 to-orange-600 border-orange-400' : 'from-gray-600 to-gray-700 border-gray-500',
      yellow: isEarned ? 'from-yellow-500 to-yellow-600 border-yellow-400' : 'from-gray-600 to-gray-700 border-gray-500',
      pink: isEarned ? 'from-pink-500 to-pink-600 border-pink-400' : 'from-gray-600 to-gray-700 border-gray-500',
      cyan: isEarned ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-gray-600 to-gray-700 border-gray-500',
      indigo: isEarned ? 'from-indigo-500 to-indigo-600 border-indigo-400' : 'from-gray-600 to-gray-700 border-gray-500',
      emerald: isEarned ? 'from-emerald-500 to-emerald-600 border-emerald-400' : 'from-gray-600 to-gray-700 border-gray-500',
      teal: isEarned ? 'from-teal-500 to-teal-600 border-teal-400' : 'from-gray-600 to-gray-700 border-gray-500',
      gold: isEarned ? 'from-amber-500 to-yellow-500 border-amber-400' : 'from-gray-600 to-gray-700 border-gray-500',
      amber: isEarned ? 'from-amber-500 to-amber-600 border-amber-400' : 'from-gray-600 to-gray-700 border-gray-500',
      gray: isEarned ? 'from-gray-400 to-gray-500 border-gray-300' : 'from-gray-600 to-gray-700 border-gray-500'
    };
    return baseColors[color] || baseColors.blue;
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-12 h-12 text-lg',
      md: 'w-16 h-16 text-2xl',
      lg: 'w-20 h-20 text-3xl'
    };
    return sizes[size] || sizes.md;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="group relative">
      <div className={`
        ${getSizeClasses()}
        bg-gradient-to-br ${getColorClasses(badge.color, badge.isEarned)}
        border-2 rounded-xl flex items-center justify-center
        transition-all duration-300 transform hover:scale-105
        ${badge.isEarned ? 'shadow-lg hover:shadow-xl' : 'opacity-60 grayscale'}
        ${showProgress ? 'mb-2' : ''}
      `}>
        <span className={`${badge.isEarned ? 'animate-pulse' : ''}`}>
          {badge.icon}
        </span>
        
        {badge.isEarned && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Star className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {showProgress && !badge.isEarned && (
        <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
          <div 
            className={`bg-gradient-to-r ${getColorClasses(badge.color, true).split(' ')[0]} ${getColorClasses(badge.color, true).split(' ')[1]} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${badge.progress}%` }}
          ></div>
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
        <div className="font-bold">{badge.name}</div>
        <div className="text-xs text-gray-300">{badge.description}</div>
        {badge.isEarned && badge.earnedAt && (
          <div className="text-xs text-green-300 mt-1">
            Earned: {formatDate(badge.earnedAt)}
          </div>
        )}
        {!badge.isEarned && (
          <div className="text-xs text-yellow-300 mt-1">
            Progress: {badge.current}/{badge.requirement}
          </div>
        )}
        
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
      </div>
    </div>
  );
};

export default Badge;