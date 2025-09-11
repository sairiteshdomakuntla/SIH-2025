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
      const response = await fetch(`${API_URL}/api/xp/badges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setBadges(data.data);
      } else {
        // Fallback: show basic badge structure if API fails or returns empty
        console.log('API returned no badges, using fallback');
        setBadges(getDefaultBadges());
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
      // Fallback: show basic badge structure if API fails
      setBadges(getDefaultBadges());
    } finally {
      setLoading(false);
    }
  };

  // Fallback badge definitions
  const getDefaultBadges = () => {
    return [
      { id: 'starter_badge', name: 'Starter', description: 'Welcome to the learning journey!', icon: '🚀', color: 'blue', isEarned: false, current: 0, requirement: 1, progress: 0, category: 'level' },
      { id: 'bronze_badge', name: 'Bronze Learner', description: 'Reach level 3', icon: '🥉', color: 'amber', isEarned: false, current: 0, requirement: 3, progress: 0, category: 'level' },
      { id: 'silver_badge', name: 'Silver Scholar', description: 'Reach level 5', icon: '🥈', color: 'gray', isEarned: false, current: 0, requirement: 5, progress: 0, category: 'level' },
      { id: 'gold_badge', name: 'Gold Graduate', description: 'Reach level 7', icon: '🥇', color: 'yellow', isEarned: false, current: 0, requirement: 7, progress: 0, category: 'level' },
      { id: 'platinum_badge', name: 'Platinum Master', description: 'Reach level 9', icon: '💎', color: 'cyan', isEarned: false, current: 0, requirement: 9, progress: 0, category: 'level' },
      { id: 'first_quiz', name: 'First Steps', description: 'Complete your first quiz', icon: '🚀', color: 'blue', isEarned: false, current: 0, requirement: 1, progress: 0, category: 'quiz' },
      { id: 'quiz_master', name: 'Quiz Master', description: 'Complete 50 quizzes', icon: '👑', color: 'purple', isEarned: false, current: 0, requirement: 50, progress: 0, category: 'quiz' },
      { id: 'perfect_score', name: 'Perfectionist', description: 'Score 100% on a quiz', icon: '⭐', color: 'green', isEarned: false, current: 0, requirement: 100, progress: 0, category: 'score' },
      { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a quiz in under 5 minutes', icon: '💨', color: 'cyan', isEarned: false, current: 0, requirement: 300, progress: 0, category: 'speed' },
      { id: 'daily_challenger', name: 'Daily Challenger', description: 'Complete 10 daily questions', icon: '📅', color: 'indigo', isEarned: false, current: 0, requirement: 10, progress: 0, category: 'daily' },
      { id: 'point_collector', name: 'Point Collector', description: 'Earn 1000 points', icon: '💎', color: 'pink', isEarned: false, current: 0, requirement: 1000, progress: 0, category: 'points' },
      { id: 'quiz_streak_3', name: 'Getting Started', description: 'Complete 3 quizzes in a row', icon: '🔥', color: 'orange', isEarned: false, current: 0, requirement: 3, progress: 0, category: 'streak' },
      { id: 'quiz_streak_7', name: 'Weekly Warrior', description: 'Complete 7 quizzes in a row', icon: '⚡', color: 'yellow', isEarned: false, current: 0, requirement: 7, progress: 0, category: 'streak' },
      { id: 'simulation_explorer', name: 'Simulation Explorer', description: 'Complete 5 simulations', icon: '🔬', color: 'teal', isEarned: false, current: 0, requirement: 5, progress: 0, category: 'simulation' }
    ];
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-full shadow-lg animate-pulse">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-yellow-200 bg-clip-text text-transparent mb-2">
            Badges & Achievements
          </h2>
          <p className="text-white/70 text-lg">
            Unlock badges by completing quizzes, challenges, and reaching new levels
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 text-center">
            <Award className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-green-300">{stats.earned}</div>
            <div className="text-green-200/80 text-sm font-medium">Badges Earned</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 text-center">
            <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-yellow-300">{stats.inProgress}</div>
            <div className="text-yellow-200/80 text-sm font-medium">In Progress</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 text-center">
            <Filter className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-purple-300">{stats.total}</div>
            <div className="text-purple-200/80 text-sm font-medium">Total Badges</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center flex-wrap gap-3 mb-8">
          {[
            { key: 'all', label: 'All', count: badges.length },
            { key: 'earned', label: 'Earned', count: stats.earned },
            { key: 'progress', label: 'In Progress', count: stats.inProgress },
            { key: 'locked', label: 'Locked', count: stats.total - stats.earned }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm ${
                filter === filterOption.key
                  ? 'bg-purple-600/40 border border-purple-400/80 text-white shadow-lg'
                  : 'bg-white/10 border border-white/20 text-gray-300 hover:border-purple-500/50 hover:bg-purple-500/20'
              }`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {filteredBadges.map(badge => (
            <div key={badge.id} className="flex flex-col items-center group">
              <Badge badge={badge} size="lg" showProgress={!badge.isEarned} />
              <div className="text-center mt-3 transition-all duration-300 group-hover:scale-105">
                <div className={`text-sm font-semibold ${badge.isEarned ? 'text-white' : 'text-gray-400'}`}>
                  {badge.name}
                </div>
                <div className="text-xs text-gray-500 mt-1 max-w-[120px]">
                  {badge.description}
                </div>
                {!badge.isEarned && (
                  <div className="text-xs text-purple-300 mt-2 font-medium">
                    {badge.current}/{badge.requirement}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 text-xl mb-2">No badges found for this filter</div>
            <div className="text-gray-500">Complete activities to start earning badges!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgesGrid;