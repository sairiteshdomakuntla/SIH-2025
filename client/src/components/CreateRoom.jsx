import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  BookOpen, 
  Target, 
  ArrowLeft,
  Gamepad2,
  Star,
  Zap,
  Crown
} from 'lucide-react';
import AutoText from './AutoText';
import { createRoom } from '../utils/roomApi';

const CreateRoom = () => {
  const [formData, setFormData] = useState({
    subject: '',
    difficulty: 'medium',
    capacity: 2,
    car: 'default'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null); // New state for showing created room

  const navigate = useNavigate();

  const subjects = [
    { value: 'Mathematics', label: 'Mathematics', icon: '🔢' },
    { value: 'Physics', label: 'Physics', icon: '⚡' },
    { value: 'Chemistry', label: 'Chemistry', icon: '🧪' },
    { value: 'Biology', label: 'Biology', icon: '🧬' },
    { value: 'English', label: 'English', icon: '📚' },
    { value: 'History', label: 'History', icon: '📜' },
    { value: 'Geography', label: 'Geography', icon: '🌍' },
    { value: 'General', label: 'General Knowledge', icon: '🎯' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'green', description: 'Perfect for beginners' },
    { value: 'medium', label: 'Medium', color: 'yellow', description: 'Balanced challenge' },
    { value: 'hard', label: 'Hard', color: 'red', description: 'For quiz masters' }
  ];

  const capacityOptions = [
    { value: 2, label: '2 Players', icon: '👥' },
    { value: 3, label: '3 Players', icon: '👨‍👩‍👦' },
    { value: 4, label: '4 Players', icon: '👨‍👩‍👧‍👦' },
    { value: 6, label: '6 Players', icon: '👥👥' }
  ];

  const carOptions = [
    { value: 'default', label: 'Default Car', icon: '🚙' },
    { value: 'sports', label: 'Sports Car', icon: '🏎️' },
    { value: 'racing', label: 'Racing Car', icon: '🏁' },
    { value: 'classic', label: 'Classic Car', icon: '🚗' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'capacity' ? parseInt(value) : value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject) {
      setError('Please select a subject');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const roomData = {
        subject: formData.subject,
        difficulty: formData.difficulty,
        capacity: formData.capacity,
        car: formData.car
      };

      const response = await createRoom(roomData);
      
      if (response.success) {
        // Show the created room instead of navigating immediately
        setCreatedRoom(response.room);
      } else {
        setError(response.message || 'Failed to create room');
      }
    } catch (err) {
      console.error('Create room error:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-green-600';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'hard': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
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
            <Star className="w-2 h-2 text-purple-400 opacity-60" />
          </div>
        ))}
      </div>

      {/* Success Message */}
      {createdRoom && (
        <div className="relative bg-gradient-to-br from-green-900/90 via-green-800/95 to-green-900/90 backdrop-blur-xl border border-green-600/50 rounded-3xl p-8 w-full max-w-2xl shadow-2xl text-center">
          <div className="mb-6">
            <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">🎉 Room Created Successfully!</h2>
            <p className="text-green-200">Share this room code with your friends</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <p className="text-gray-300 mb-2">Room Code:</p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-lg text-green-400 border border-green-600">
              {createdRoom.roomCode}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(createdRoom.roomCode)}
              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              📋 Copy Room Code
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-gray-800/30 rounded-lg p-3">
              <p className="text-gray-400">Subject</p>
              <p className="text-white font-semibold">{createdRoom.subject}</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3">
              <p className="text-gray-400">Difficulty</p>
              <p className="text-white font-semibold capitalize">{createdRoom.difficulty}</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3">
              <p className="text-gray-400">Capacity</p>
              <p className="text-white font-semibold">{createdRoom.capacity} Players</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3">
              <p className="text-gray-400">Status</p>
              <p className="text-green-400 font-semibold">Waiting for Players</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/quiz-generator', { 
                state: { 
                  roomCode: createdRoom.roomCode,
                  subject: createdRoom.subject,
                  difficulty: createdRoom.difficulty,
                  isMultiplayer: true
                }
              })}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
            >
              🚀 Enter Room
            </button>
            <button
              onClick={() => setCreatedRoom(null)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
            >
              ➕ Create Another Room
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      {!createdRoom && (
        <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-gray-600/50 rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-6 left-6 flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Floating elements */}
        <div className="absolute -top-6 -right-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-3 rotate-12 shadow-lg">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -bottom-4 -left-4 bg-gradient-to-br from-green-500 to-purple-600 rounded-full p-2 -rotate-12 shadow-lg">
          <Trophy className="w-5 h-5 text-white" />
        </div>

        {/* Title Section */}
        <div className="relative z-10 text-center mb-8 mt-8">
          <AutoText 
            tag="h1"
            className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2"
          >
            Create Battle Room
          </AutoText>
          <AutoText 
            tag="p"
            className="text-gray-300 text-sm"
          >
            Set up your multiplayer quiz arena
          </AutoText>
        </div>

        {/* Error Message */}
        {error && (
          <div className="relative z-10 mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-1 rounded-full">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <AutoText className="text-red-200 font-medium">{error}</AutoText>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          {/* Subject Selection */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <AutoText>Subject</AutoText>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, subject: subject.value })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.subject === subject.value
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-gray-700/50 border-gray-600/40 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{subject.icon}</span>
                    <span className="font-medium">{subject.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <AutoText>Difficulty</AutoText>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: diff.value })}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    formData.difficulty === diff.value
                      ? `bg-gradient-to-r ${getDifficultyColor(diff.value)}/30 border-${diff.color}-400 text-white`
                      : 'bg-gray-700/50 border-gray-600/40 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <div className="font-bold text-lg">{diff.label}</div>
                  <div className="text-xs opacity-75">{diff.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Room Capacity */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Users className="w-4 h-4 text-green-400" />
              </div>
              <AutoText>Room Capacity</AutoText>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {capacityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, capacity: option.value })}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    formData.capacity === option.value
                      ? 'bg-green-600/30 border-green-400 text-white'
                      : 'bg-gray-700/50 border-gray-600/40 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Car Selection */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
              </div>
              <AutoText>Your Car</AutoText>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {carOptions.map((car) => (
                <button
                  key={car.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, car: car.value })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.car === car.value
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-gray-700/50 border-gray-600/40 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{car.icon}</span>
                    <span className="font-medium">{car.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Quiz ID */}
          <div className="space-y-2">
            <label 
              htmlFor="quizId" 
              className="flex items-center space-x-3 text-white/90 font-medium text-sm"
            >
              <div className="p-2 bg-gray-600/20 rounded-lg">
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <AutoText>Quiz ID (Optional)</AutoText>
            </label>
            <input
              type="text"
              name="quizId"
              id="quizId"
              value={formData.quizId}
              onChange={handleChange}
              onFocus={() => setActiveField('quizId')}
              onBlur={() => setActiveField('')}
              className="w-full bg-gray-900/70 border border-gray-600/60 rounded-2xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:border-gray-400/80 focus:bg-gray-800/80 transition-all duration-300 backdrop-blur-sm"
              placeholder="Enter specific quiz ID (leave empty for auto-generated)"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <AutoText>Creating Room...</AutoText>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <Crown className="w-5 h-5" />
                <AutoText>Create Battle Room</AutoText>
              </div>
            )}
            
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </form>
        </div>
      )}
    </div>
  );
};

export default CreateRoom;