import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gamepad2, User, LogOut } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import AutoText from './AutoText';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
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
        {/* Language Switcher */}
        <LanguageSwitcher />
        
        {user ? (
          <>
            <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
              <User className="w-5 h-5 text-white" />
              <span className="text-white font-medium">{user.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-200 hover:text-red-100 font-medium transition-all duration-300 backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4" />
              <AutoText>Logout</AutoText>
            </button>
          </>
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
