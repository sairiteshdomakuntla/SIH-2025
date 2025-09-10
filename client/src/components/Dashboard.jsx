import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Star, BookOpen, Target, Crown, Zap, Brain, Beaker } from 'lucide-react';
import AutoText from './AutoText';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <AutoText>Welcome back</AutoText>, <span className="text-yellow-300">{user?.name}!</span>
              </h1>
              <p className="text-purple-200 text-lg">
                <AutoText>Ready to continue your learning quest?</AutoText>
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-2">
                  <Crown className="h-8 w-8 text-purple-700" />
                </div>
                <p className="text-sm font-bold">
                  <AutoText>Level</AutoText> {user?.level || 1}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  <AutoText>Total XP</AutoText>
                </p>
                <p className="text-2xl font-bold text-gray-900">{user?.points || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  <AutoText>Achievements</AutoText>
                </p>
                <p className="text-2xl font-bold text-gray-900">{user?.achievements || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  <AutoText>Courses</AutoText>
                </p>
                <p className="text-2xl font-bold text-gray-900">{user?.completedCourses || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  <AutoText>Streak</AutoText>
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.streak || 0} <AutoText tag="span">days</AutoText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              <AutoText>Continue Your Quest</AutoText>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <AutoText>Mathematics Adventure</AutoText>
                    </h3>
                    <p className="text-sm text-gray-600">
                      <AutoText>Continue with Chapter 5</AutoText>
                    </p>
                  </div>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <AutoText>Continue</AutoText>
                </button>
              </div>
              
              {/* AI Quiz Generator */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Brain className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Quiz Challenge</h3>
                    <p className="text-sm text-gray-600">Personalized quizzes powered by AI</p>
                  </div>
                </div>
                <Link 
                  to="/quiz" 
                  className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300"
                >
                  Start Quiz
                </Link>
              </div>

              {/* Interactive Simulations */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Beaker className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <AutoText>Interactive Simulations</AutoText>
                    </h3>
                    <p className="text-sm text-gray-600">
                      <AutoText>Explore science through virtual experiments</AutoText>
                    </p>
                  </div>
                </div>
                <Link 
                  to="/simulations" 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300"
                >
                  <AutoText>Explore</AutoText>
                </Link>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              <AutoText>Recent Achievements</AutoText>
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-900">
                    <AutoText>First Quest!</AutoText>
                  </p>
                  <p className="text-sm text-gray-600">
                    <AutoText>Completed first lesson</AutoText>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;