import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Star, 
  BookOpen, 
  User, 
  LogOut, 
  Menu, 
  X,
  Crown,
  Zap
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 shadow-xl border-b-4 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-yellow-400 rounded-lg transform group-hover:rotate-12 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-purple-700" />
              </div>
              <span className="text-xl font-bold text-white">
                रुरल <span className="text-yellow-300">Quest</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {/* User Stats */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-yellow-500 px-3 py-1 rounded-full">
                    <Crown className="h-4 w-4 text-yellow-900" />
                    <span className="text-sm font-bold text-yellow-900">
                      Level {user.level || 1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-500 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 text-white" />
                    <span className="text-sm font-bold text-white">
                      {user.points || 0} XP
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 bg-green-500 px-3 py-1 rounded-full">
                    <Trophy className="h-4 w-4 text-white" />
                    <span className="text-sm font-bold text-white">
                      {user.achievements || 0}
                    </span>
                  </div>
                </div>

                {/* Navigation Links */}
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-1 text-white hover:text-yellow-300 transition-colors duration-200 font-medium"
                >
                  <Zap className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/courses" 
                  className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium"
                >
                  Courses
                </Link>

                <Link 
                  to="/leaderboard" 
                  className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium"
                >
                  Leaderboard
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200">
                    <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-700" />
                    </div>
                    <span className="text-white font-medium">{user.name}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <Link 
                      to="/profile" 
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-yellow-500 hover:bg-yellow-400 text-purple-700 font-bold px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Start Quest
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-yellow-300 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-purple-700 border-t border-purple-500">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center justify-center space-x-4 py-4 border-b border-purple-500">
                  <div className="flex items-center space-x-1 bg-yellow-500 px-2 py-1 rounded-full">
                    <Crown className="h-3 w-3 text-yellow-900" />
                    <span className="text-xs font-bold text-yellow-900">Lv.{user.level || 1}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-500 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 text-white" />
                    <span className="text-xs font-bold text-white">{user.points || 0}</span>
                  </div>
                </div>
                <Link to="/dashboard" className="block px-3 py-2 text-white hover:bg-purple-600 rounded-md">
                  Dashboard
                </Link>
                <Link to="/courses" className="block px-3 py-2 text-white hover:bg-purple-600 rounded-md">
                  Courses
                </Link>
                <Link to="/leaderboard" className="block px-3 py-2 text-white hover:bg-purple-600 rounded-md">
                  Leaderboard
                </Link>
                <Link to="/profile" className="block px-3 py-2 text-white hover:bg-purple-600 rounded-md">
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-red-300 hover:bg-red-600 hover:text-white rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-white hover:bg-purple-600 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 text-yellow-300 hover:bg-purple-600 rounded-md font-bold"
                  onClick={() => setIsOpen(false)}
                >
                  Start Quest
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;