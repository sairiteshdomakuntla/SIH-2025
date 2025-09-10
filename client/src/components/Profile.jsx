import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { 
  User, 
  Mail, 
  MapPin, 
  BookOpen, 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Shield, 
  Edit, 
  Save, 
  X, 
  Camera,
  Badge,
  Calendar,
  Target
} from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    grade: '',
    interests: [],
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Available subjects for interests
  const subjects = ['Math', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Art', 'Music'];
  const grades = ['5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        location: user.location || '',
        grade: user.grade || '',
        interests: user.interests || [],
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleInterestToggle = (interest) => {
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];

    setFormData({
      ...formData,
      interests: newInterests
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        location: user.location || '',
        grade: user.grade || '',
        interests: user.interests || [],
        bio: user.bio || ''
      });
    }
    setIsEditing(false);
    setError('');
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user context with new avatar
        await updateProfile({ avatar: data.avatarUrl });
      } else {
        setError(data.message || 'Failed to upload avatar');
      }
    } catch (err) {
      setError('An error occurred while uploading avatar');
    }

    setIsLoading(false);
  };

  const handleAvatarRemove = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmAvatarRemove = async () => {
    setShowDeleteConfirm(false);
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user context to remove avatar
        await updateProfile({ avatar: '' });
      } else {
        setError(data.message || 'Failed to remove avatar');
      }
    } catch (err) {
      setError('An error occurred while removing avatar');
    }

    setIsLoading(false);
  };

  // Calculate user stats
  const userLevel = user?.level || 1;
  const userXP = user?.points || 0;
  const userAchievements = user?.achievements || 0;
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
  const completedQuizzes = user?.completedQuizzes || 0;
  const averageScore = user?.averageScore || 0;

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

      {/* Profile Container */}
      <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-4xl">
        
        {/* Header Section */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 rounded-full p-2 shadow-lg transition-colors duration-200 cursor-pointer ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Camera className="w-4 h-4 text-white" />
              </label>
              {user?.avatar && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={isLoading}
                  className={`absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 shadow-lg transition-colors duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Remove avatar"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                {user?.name || 'Explorer'}
              </h1>
              <p className="text-white/80 text-lg flex items-center">
                <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                Level {userLevel} Adventurer
              </p>
            </div>
          </div>

          {/* Edit Button */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-200 hover:text-purple-100 font-medium transition-all duration-300 backdrop-blur-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-green-200 hover:text-green-100 font-medium transition-all duration-300 backdrop-blur-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-200 hover:text-red-100 font-medium transition-all duration-300 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="relative z-10 mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-1 rounded-full">
                <X className="w-4 h-4 text-white" />
              </div>
              <span className="text-red-200 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/40 rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-300">{userAchievements}</div>
            <div className="text-yellow-200/80 text-sm">Achievements</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/40 rounded-xl p-4 text-center">
            <Star className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-300">{userXP}</div>
            <div className="text-blue-200/80 text-sm">Experience Points</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/40 rounded-xl p-4 text-center">
            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-300">{completedQuizzes}</div>
            <div className="text-green-200/80 text-sm">Quizzes Completed</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/40 rounded-xl p-4 text-center">
            <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-300">{averageScore}%</div>
            <div className="text-purple-200/80 text-sm">Average Score</div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
                <div className="p-2 rounded-lg bg-purple-600/50 border border-purple-400/80">
                  <User className="w-4 h-4" />
                </div>
                <span>Character Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-4 bg-black/60 border border-gray-600/40 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors duration-200 disabled:opacity-60"
                placeholder="Enter your name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
                <div className="p-2 rounded-lg bg-blue-600/50 border border-blue-400/80">
                  <Mail className="w-4 h-4" />
                </div>
                <span>Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-4 bg-black/60 border border-gray-600/40 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors duration-200 disabled:opacity-60"
                placeholder="Enter your email"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
                <div className="p-2 rounded-lg bg-green-600/50 border border-green-400/80">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Home Base</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-4 bg-black/60 border border-gray-600/40 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors duration-200 disabled:opacity-60"
                placeholder="Your village/city"
              />
            </div>

            {/* Grade */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
                <div className="p-2 rounded-lg bg-yellow-600/50 border border-yellow-400/80">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Learning Level</span>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-4 bg-black/60 border border-gray-600/40 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors duration-200 disabled:opacity-60"
              >
                <option value="">Select your grade</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade} className="bg-gray-800">
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Bio */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
                <div className="p-2 rounded-lg bg-pink-600/50 border border-pink-400/80">
                  <Badge className="w-4 h-4" />
                </div>
                <span>About Me</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows="4"
                className="w-full p-4 bg-black/60 border border-gray-600/40 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors duration-200 resize-none disabled:opacity-60"
                placeholder="Tell us about your learning journey..."
              />
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
                <div className="p-2 rounded-lg bg-indigo-600/50 border border-indigo-400/80">
                  <Star className="w-4 h-4" />
                </div>
                <span>Learning Interests</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => isEditing && handleInterestToggle(subject)}
                    disabled={!isEditing}
                    className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
                      formData.interests.includes(subject)
                        ? 'bg-purple-500/30 border-purple-400/60 text-purple-200'
                        : 'bg-gray-700/30 border-gray-600/40 text-gray-300'
                    } ${isEditing ? 'hover:bg-purple-500/20 cursor-pointer' : 'cursor-default opacity-60'}`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* Join Date */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white/90 font-medium text-sm">
                <div className="p-2 rounded-lg bg-teal-600/50 border border-teal-400/80">
                  <Calendar className="w-4 h-4" />
                </div>
                <span>Quest Started</span>
              </label>
              <div className="w-full p-4 bg-black/60 border border-gray-600/40 rounded-xl text-white/80">
                {joinDate}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-6 right-6 opacity-30">
          <Shield className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <div className="absolute bottom-6 left-6 opacity-30">
          <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
        </div>
        <div className="absolute top-1/2 right-8 opacity-20">
          <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmAvatarRemove}
        title="Remove Profile Picture"
        message="Are you sure you want to remove your profile picture? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Profile;
