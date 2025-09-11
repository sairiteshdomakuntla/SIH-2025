import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gamepad2, User, LogOut, ChevronDown, Brain, Beaker, MessageCircle, Trophy, Award } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import AutoText from './AutoText';

const Header = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  return (
    <nav className="relative z-20 flex items-center justify-between p-6 backdrop-blur-xl bg-black/20 border-b border-purple-500/30 shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
          <Gamepad2 className="w-6 h-6 text-white" />
        </div>
        <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent hover:from-purple-200 hover:to-white transition-all duration-300">
          <AutoText>Rural Quest</AutoText>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Navigation Links - only show when logged in */}
        {user && (
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/quiz" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-purple-400/50 text-white/80 hover:text-white transition-all duration-300"
            >
              <Brain className="w-4 h-4" />
              <AutoText>Quiz</AutoText>
            </Link>
            <Link 
              to="/simulations" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-blue-400/50 text-white/80 hover:text-white transition-all duration-300"
            >
              <Beaker className="w-4 h-4" />
              <AutoText>Simulations</AutoText>
            </Link>
            <Link 
              to="/leaderboard" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-yellow-400/50 text-white/80 hover:text-white transition-all duration-300"
            >
              <Trophy className="w-4 h-4" />
              <AutoText>Leaderboard</AutoText>
            </Link>
            <Link 
              to="/badges" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-orange-400/50 text-white/80 hover:text-white transition-all duration-300"
            >
              <Award className="w-4 h-4" />
              <AutoText>Badges</AutoText>
            </Link>
            <Link 
              to="/learn-animations" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-green-400/50 text-white/80 hover:text-white transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4" />
              <AutoText>AI Learning</AutoText>
            </Link>
          </div>
        )}

        {/* Language Switcher */}
        <LanguageSwitcher />
        
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg transition-all duration-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-medium truncate">{user.name}</span>
                <span className="text-white/60 text-xs">Level {user?.level || 1}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/90 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl overflow-hidden z-50">
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition-colors duration-200 flex items-center space-x-3"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-red-200 hover:bg-red-500/30 transition-colors duration-200 flex items-center space-x-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link 
              to="/register"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300 backdrop-blur-sm"
            >
              <AutoText>Join Quest</AutoText>
            </Link>
            <Link 
              to="/login"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-medium transition-all duration-300 shadow-lg"
            >
              <AutoText>Start Quest</AutoText>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;
