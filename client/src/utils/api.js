import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  timeout: 60000, // 1 minute default timeout for regular requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false, // Set to true if you need cookies/auth
});

// Create separate instance for animation requests with longer timeout
const animationApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  timeout: 150000, // 2.5 minutes for animation requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response received from: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle common error cases
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      error.message = 'Network error. Please check your connection and try again.';
    } else if (error.response?.status === 404) {
      error.message = 'Service not found. Please check if the server is running.';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please try again later.';
    } else if (error.response?.status === 503) {
      error.message = 'Service temporarily unavailable. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

// Apply same interceptors to animation API
animationApi.interceptors.request.use(...api.interceptors.request.handlers);
animationApi.interceptors.response.use(...api.interceptors.response.handlers);

export { api, animationApi };
export default api;
