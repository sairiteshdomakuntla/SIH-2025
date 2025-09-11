import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';
import { Trophy, Award, Filter } from 'lucide-react';

const BadgesGrid = () => {
  const [badges, setBadges] = useState([]);
  const [filteredBadges, setFilteredBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
 const token=localStorage.getItem('token') ;

  const API_URL = import.meta.env.VITE_BACKEND_URL ;

  useEffect(() => {
    fetchBadges();
  }, []);

  useEffect(() => {
    filterBadges();
  }, [badges, filter]);

  const fetchBadges = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile/badges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setBadges(data.badges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBadges = () => {
    let filtered = badges;
    
    switch (filter) {
      case 'earned':
        filtered = badges.filter(badge => badge.isEarned);
        break;
      case 'progress':
        filtered = badges.filter(badge => !badge.isEarned && badge.progress > 0);
        break;
      case 'locked':
        filtered = badges.filter(badge => !badge.isEarned);
        break;
      default:
        filtered = badges;
    }
    
    setFilteredBadges(filtered);
  };

  const getFilterStats = () => {
    const earned = badges.filter(badge => badge.isEarned).length;
    const total = badges.length;
    const inProgress = badges.filter(badge => !badge.isEarned && badge.progress > 0).length;
    
    return { earned, total, inProgress };
  };

  const stats = getFilterStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-full shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
          Badges & Achievements
        </h2>
        <p className="text-white/80">
          Unlock badges by completing quizzes and challenges
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/40 rounded-xl p-4 text-center">
          <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-300">{stats.earned}</div>
          <div className="text-green-200/80 text-sm">Badges Earned</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/40 rounded-xl p-4 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-300">{stats.inProgress}</div>
          <div className="text-yellow-200/80 text-sm">In Progress</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/40 rounded-xl p-4 text-center">
          <Filter className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-300">{stats.total}</div>
          <div className="text-purple-200/80 text-sm">Total Badges</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center space-x-2 mb-6">
        {[
          { key: 'all', label: 'All', count: badges.length },
          { key: 'earned', label: 'Earned', count: stats.earned },
          { key: 'progress', label: 'In Progress', count: stats.inProgress },
          { key: 'locked', label: 'Locked', count: stats.total - stats.earned }
        ].map(filterOption => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === filterOption.key
                ? 'bg-purple-600/30 border border-purple-400/80 text-purple-200'
                : 'bg-gray-800/50 border border-gray-600/50 text-gray-300 hover:border-purple-500/50'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {filteredBadges.map(badge => (
          <div key={badge.id} className="flex flex-col items-center">
            <Badge badge={badge} size="lg" showProgress={!badge.isEarned} />
            <div className="text-center mt-2">
              <div className={`text-sm font-medium ${badge.isEarned ? 'text-white' : 'text-gray-400'}`}>
                {badge.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {badge.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No badges found for this filter</div>
        </div>
      )}
    </div>
  );
};

export default BadgesGrid;