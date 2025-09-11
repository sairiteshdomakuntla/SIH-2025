import api from './api.js';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create a new room
export const createRoom = async ({ quizId, subject, difficulty, capacity, car }) => {
  try {
    const response = await api.post('/api/rooms/create', {
      quizId,
      subject,
      difficulty,
      capacity,
      car
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Create room error:', error);
    throw error;
  }
};

// Join an existing room
export const joinRoom = async (roomCode, car = 'default') => {
  try {
    const response = await api.post(`/api/rooms/join/${roomCode}`, {
      car
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Join room error:', error);
    throw error;
  }
};

// Join room by code (simplified version)
export const joinRoomByCode = async (code, userId) => {
  try {
    const response = await api.post(`/api/rooms/join-by-code/${code}`, {
      userId
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Join room by code error:', error);
    throw error;
  }
};

// Set ready status in room
export const setReady = async (roomCode, ready = true) => {
  try {
    const response = await api.patch(`/api/rooms/${roomCode}/ready`, {
      ready
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Set ready error:', error);
    throw error;
  }
};

// Complete room (submit score and time)
export const completeRoom = async (roomCode, { score, timeTaken }) => {
  try {
    const response = await api.patch(`/api/rooms/${roomCode}/complete`, {
      score,
      timeTaken
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Complete room error:', error);
    throw error;
  }
};

// Get room details
export const getRoom = async (roomCode) => {
  try {
    const response = await api.get(`/api/rooms/${roomCode}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Get room error:', error);
    throw error;
  }
};

// Export all functions as default object
const roomApi = {
  createRoom,
  joinRoom,
  joinRoomByCode,
  setReady,
  completeRoom,
  getRoom
};

export default roomApi;