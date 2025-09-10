import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Gamepad2, Sparkles, Shield, Zap, Trophy, Star } from 'lucide-react';
import AutoText from './AutoText';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeField, setActiveField] = useState('');

  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(formData);
    if (result.success) {
      navigate(from, { replace: true });
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
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

      {/* Glass morphism container */}
      <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 m-35 shadow-2xl relative overflow-hidden w-full max-w-md">
          
          {/* Top gaming badge */}
          <div className="relative z-10 flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title Section */}
          <div className="relative z-10 text-center mb-8">
            <AutoText 
              tag="h1"
              className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2"
            >
              Welcome Back, Hero!
            </AutoText>
            <AutoText 
              tag="p"
              className="text-white/80 text-lg"
            >
              Continue your epic learning journey
            </AutoText>
            {/* Achievement badges */}
            <div className="flex justify-center space-x-2 mt-4">
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

          {/* Error Display */}
          {error && (
            <div className="relative z-10 mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500 p-1 rounded-full">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <AutoText className="text-red-200 font-medium">{error}</AutoText>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="flex items-center space-x-3 text-white/90 font-medium text-sm"
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  activeField === 'email' 
                    ? 'bg-purple-600/50 border border-purple-400/80' 
                    : 'bg-gray-800/60 border border-gray-600/40'
                }`}>
                  <Mail className="w-4 h-4" />
                </div>
                <AutoText>Email Address</AutoText>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setActiveField('email')}
                  onBlur={() => setActiveField('')}
                  className="w-full bg-gray-900/70 border border-gray-600/60 rounded-2xl px-4 py-4 text-white placeholder-gray-300 focus:outline-none focus:border-purple-400/80 focus:bg-gray-800/80 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="flex items-center space-x-3 text-white/90 font-medium text-sm"
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  activeField === 'password' 
                    ? 'bg-purple-500/40 border border-purple-400/60' 
                    : 'bg-white/10 border border-white/20'
                }`}>
                  <Lock className="w-4 h-4" />
                </div>
                <AutoText>Password</AutoText>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField('')}
                  className="w-full bg-gray-900/70 border border-gray-600/60 rounded-2xl px-4 py-4 pr-12 text-white placeholder-gray-300 focus:outline-none focus:border-purple-400/80 focus:bg-gray-800/80 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                style={{ width: `${formData.email && formData.password ? '100' : formData.email || formData.password ? '50' : '10'}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative flex items-center justify-center space-x-3">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <AutoText>Starting Adventure...</AutoText>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <AutoText>Begin Epic Journey</AutoText>
                    <Zap className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Register Link */}
          <div className="relative z-10 mt-8 text-center">
            <p className="text-white/80">
              <AutoText>New adventurer? </AutoText>
              <Link 
                to="/register" 
                className="text-purple-300 hover:text-purple-200 font-semibold transition-colors duration-200 hover:underline"
              >
                <AutoText>Create Your Character</AutoText>
              </Link>
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 opacity-30">
            <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-30">
            <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
          </div>
        </div>
    </div>
  );
};

export default Login;