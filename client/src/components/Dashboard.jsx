import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Star, BookOpen, Target, Crown, Zap, Brain, Beaker, Flame, FileText, Sparkles, Users, TrendingUp, Award } from 'lucide-react';
import AutoText from './AutoText';
import XPDisplay from './XPDisplay';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
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
            <Star className="w-2 h-2 text-pink-400 opacity-60" />
          </div>
        ))}
      </div>

      <div className="w-full relative z-10 m-10">
        {/* Welcome Header */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    <AutoText>Welcome back</AutoText>, <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">{user?.name}!</span>
                  </h1>
                  <p className="text-white/80 text-lg">
                    <AutoText>Ready to continue your learning quest?</AutoText>
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-purple-500/30">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mb-2 mx-auto">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-bold text-white">
                  <AutoText>Level</AutoText> {user?.level || 1}
                </p>
              </div>
              <div className="text-center backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-purple-500/30">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mb-2 mx-auto">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-bold text-white">
                  {user?.points || 0} <AutoText tag="span">XP</AutoText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">
                  <AutoText>Total XP</AutoText>
                </p>
                <p className="text-2xl font-bold text-white">{user?.points || 0}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">
                  <AutoText>Achievements</AutoText>
                </p>
                <p className="text-2xl font-bold text-white">{user?.achievements || 0}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">
                  <AutoText>Courses</AutoText>
                </p>
                <p className="text-2xl font-bold text-white">{user?.completedCourses || 0}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">
                  <AutoText>Streak</AutoText>
                </p>
                <p className="text-2xl font-bold text-white">
                  {user?.streak || 0} <AutoText tag="span">days</AutoText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                <AutoText>Continue Your Quest</AutoText>
              </h2>
            </div>
            <div className="space-y-4">
              <div className="group p-6 bg-white/10 hover:bg-white/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors duration-300">
                        <AutoText>Learning Community</AutoText>
                      </h3>
                      <p className="text-sm text-white/70">
                        <AutoText>Connect, chat, and grow with peers</AutoText>
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/community"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                  >
                    <AutoText>Join</AutoText>
                  </Link>
                </div>
              </div>
              
              {/* AI Quiz Generator */}
              <div className="group p-6 bg-white/10 hover:bg-white/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors duration-300">
                        <AutoText>AI Quiz Challenge</AutoText>
                      </h3>
                      <p className="text-sm text-white/70">
                        <AutoText>Personalized quizzes powered by AI</AutoText>
                      </p>
                    </div>
                  </div>
                  <Link 
                    to="/quiz" 
                    className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                  >
                    <AutoText>Start Quiz</AutoText>
                  </Link>
                </div>
              </div>

              {/* Interactive Simulations */}
              <div className="group p-6 bg-white/10 hover:bg-white/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Beaker className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors duration-300">
                        <AutoText>Interactive Simulations</AutoText>
                      </h3>
                      <p className="text-sm text-white/70">
                        <AutoText>Explore science through virtual experiments</AutoText>
                      </p>
                    </div>
                  </div>
                  <Link 
                    to="/simulations" 
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
                  >
                    <AutoText>Explore</AutoText>
                  </Link>
                </div>
              </div>

              {/* AI Learning Assistant */}
              <div className="group p-6 bg-white/10 hover:bg-white/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors duration-300">
                        <AutoText>AI Learning Assistant</AutoText>
                      </h3>
                      <p className="text-sm text-white/70">
                        <AutoText>Get instant help with animations and explanations</AutoText>
                      </p>
                    </div>
                  </div>
                  <Link 
                    to="/learn-animations" 
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg"
                  >
                    <AutoText>Learn</AutoText>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* XP Display & Quick Actions */}
          <div className="space-y-6">
            {/* XP Display */}
            <XPDisplay userId={user?.id} showDetails={true} />

            {/* Quick Navigation */}
            <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    <AutoText>Weekly Competition</AutoText>
                  </h3>
                </div>
              </div>
              <p className="text-white/80 mb-4">
                <AutoText>See how you rank against other learners this week!</AutoText>
              </p>
              <button 
                onClick={() => navigate('/leaderboard')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <AutoText>View Leaderboard</AutoText>
              </button>
            </div>

            {/* Daily Challenge */}
            <div className="backdrop-blur-xl bg-black/40 border border-orange-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-orange-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg shadow-lg">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    <AutoText>Daily Challenge</AutoText>
                  </h3>
                </div>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-white">{user?.currentStreak || 0}</span>
                </div>
              </div>
              <p className="text-white/80 mb-4">
                <AutoText>Complete today's question to maintain your streak!</AutoText>
              </p>
              <button 
                onClick={() => navigate('/daily-question')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <AutoText>Take Today's Challenge</AutoText>
              </button>
            </div>

            {/* Badges */}
            <div className="backdrop-blur-xl bg-black/40 border border-yellow-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-yellow-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg shadow-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    <AutoText>Badges & Achievements</AutoText>
                  </h3>
                </div>
              </div>
              <p className="text-white/80 mb-4">
                <AutoText>Track your progress and unlock new badges!</AutoText>
              </p>
              <button 
                onClick={() => navigate('/badges')}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <AutoText>View Badges</AutoText>
              </button>
            </div>

            {/* Notes */}
            <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-4 shadow-2xl relative overflow-hidden group hover:border-purple-400/50 transition-all duration-300">
              <Link 
                to="/notes" 
                className="flex items-center space-x-3 text-white hover:text-purple-200 transition-colors duration-300"
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">
                  <AutoText>My Notes</AutoText>
                </span>
                <Sparkles className="w-4 h-4 text-purple-400 ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;