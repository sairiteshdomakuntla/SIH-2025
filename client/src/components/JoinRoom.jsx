import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { joinRoom } from '../utils/roomApi';

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!user) {
      setError('Please log in to join a room');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await joinRoom(roomCode, 'default'); // Pass car type, userId comes from JWT token
      
      // Navigate to room on success
      navigate(`/room/${roomCode}`);
    } catch (err) {
      console.error('Join room error:', err);
      
      if (err.response?.status === 404) {
        setError('Room not found');
      } else if (err.response?.status === 400) {
        const message = err.response?.data?.message;
        setError(message || 'Unable to join room. Please try again.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Join Room
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-2">
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter room code"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !roomCode.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;