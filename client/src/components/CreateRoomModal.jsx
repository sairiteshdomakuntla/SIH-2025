import React, { useState } from 'react';
import { X, Hash, BookOpen, Users, Lock, Globe, Plus } from 'lucide-react';

const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: 'General',
    description: '',
    isPrivate: false,
    maxUsers: 50
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'English', 'History', 'Geography', 'General'
  ];

  const subjectColors = {
    'Mathematics': 'from-blue-500 to-blue-600',
    'Physics': 'from-green-500 to-green-600',
    'Chemistry': 'from-purple-500 to-purple-600',
    'Biology': 'from-emerald-500 to-emerald-600',
    'English': 'from-pink-500 to-pink-600',
    'History': 'from-orange-500 to-orange-600',
    'Geography': 'from-teal-500 to-teal-600',
    'General': 'from-gray-500 to-gray-600'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/community/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        onRoomCreated(data.room);
        onClose();
        // Reset form
        setFormData({
          name: '',
          subject: 'General',
          description: '',
          isPrivate: false,
          maxUsers: 50
        });
      } else {
        setError(data.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Create room error:', error);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 border border-white/20 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Create New Room</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-white font-medium mb-2">
              Room Name *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter room name"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                required
                maxLength={50}
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-white font-medium mb-2">
              Subject *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 appearance-none"
                required
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject} className="bg-gray-800">
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Preview */}
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${subjectColors[formData.subject]} flex items-center justify-center`}>
              <Hash className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{formData.name || 'Room Preview'}</p>
              <p className="text-white/60 text-sm">{formData.subject}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this room is about..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-white/60 text-xs mt-1">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Room Settings */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Room Settings</h3>
            
            {/* Privacy */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                {formData.isPrivate ? (
                  <Lock className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Globe className="w-4 h-4 text-green-400" />
                )}
                <div>
                  <p className="text-white font-medium">
                    {formData.isPrivate ? 'Private Room' : 'Public Room'}
                  </p>
                  <p className="text-white/60 text-sm">
                    {formData.isPrivate 
                      ? 'Only invited users can join' 
                      : 'Anyone can discover and join'
                    }
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Max Users */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Users className="inline w-4 h-4 mr-2" />
                Maximum Users: {formData.maxUsers}
              </label>
              <input
                type="range"
                name="maxUsers"
                value={formData.maxUsers}
                onChange={handleInputChange}
                min="10"
                max="100"
                step="10"
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-white/60 text-xs mt-1">
                <span>10</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;