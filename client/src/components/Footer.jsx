import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Gamepad2, 
  Star, 
  Trophy, 
  Shield, 
  Zap, 
  Heart,
  Github,
  Twitter,
  Mail
} from 'lucide-react';
import AutoText from './AutoText';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 border-t border-purple-500/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <AutoText 
                tag="span"
                className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
              >
                Rural Quest
              </AutoText>
            </div>
            <AutoText 
              tag="p"
              className="text-gray-300 text-sm"
            >
              Gamifying rural education for the next generation of learners. Adventure awaits in every lesson!
            </AutoText>
            <div className="flex space-x-3">
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-full p-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-full p-2">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div className="bg-green-500/20 border border-green-500/40 rounded-full p-2">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Star className="w-5 h-5 text-purple-400" />
              <AutoText>Quick Quest</AutoText>
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-sm">
                  <AutoText>Dashboard</AutoText>
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-sm">
                  <AutoText>Leaderboard</AutoText>
                </Link>
              </li>
              <li>
                <Link to="/achievements" className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-sm">
                  <AutoText>Achievements</AutoText>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-sm">
                  <AutoText>Profile</AutoText>
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning Areas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <AutoText>Learning Realms</AutoText>
            </h3>
            <ul className="space-y-2">
              <AutoText tag="li" className="text-gray-300 text-sm">Mathematics Kingdom</AutoText>
              <AutoText tag="li" className="text-gray-300 text-sm">Science Laboratory</AutoText>
              <AutoText tag="li" className="text-gray-300 text-sm">Language Arts</AutoText>
              <AutoText tag="li" className="text-gray-300 text-sm">Social Studies</AutoText>
              <AutoText tag="li" className="text-gray-300 text-sm">Creative Arts</AutoText>
            </ul>
          </div>

          {/* Connect Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-400" />
              <AutoText>Connect</AutoText>
            </h3>
            <div className="space-y-3">
              <div className="flex space-x-3">
                <a 
                  href="#" 
                  className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-lg p-2 transition-all duration-300"
                >
                  <Github className="w-5 h-5 text-purple-400" />
                </a>
                <a 
                  href="#" 
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-lg p-2 transition-all duration-300"
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                </a>
                <a 
                  href="#" 
                  className="bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 rounded-lg p-2 transition-all duration-300"
                >
                  <Mail className="w-5 h-5 text-pink-400" />
                </a>
              </div>
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-3">
                <AutoText 
                  tag="p"
                  className="text-sm text-gray-300"
                >
                  Join our quest to transform rural education!
                </AutoText>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-purple-500/30">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <AutoText tag="span">© 2025 Rural Quest.</AutoText>
              <AutoText tag="span">All adventures reserved.</AutoText>
              <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors duration-300">
                <AutoText>Privacy Policy</AutoText>
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-purple-400 transition-colors duration-300">
                <AutoText>Terms of Service</AutoText>
              </Link>
              <Link to="/help" className="text-gray-400 hover:text-purple-400 transition-colors duration-300">
                <AutoText>Help Center</AutoText>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
