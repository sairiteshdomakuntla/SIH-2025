import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, redirect } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import RootLayout from './components/RootLayout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Community from './components/Community';
import Resources from './components/Resources';
import QuizGenerator from './components/QuizGenerator';
import Simulations from './components/Simulations';
import SimulationView from './components/SimulationView';
import LearnViaAnimations from './components/LearnViaAnimations';
import ErrorPage from './components/ErrorPage';
import DailyQuestion from './components/DailyQuestion';
import Notes from './components/Notes';
import NoteView from './components/NoteView';
import BadgesGrid from './components/BadgesGrid';
import InteractiveLearning from './components/InteractiveLearning';
import LeaderboardPage from './components/LeaderboardPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated and listen for changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (when login/logout happens)
    window.addEventListener('storage', checkAuth);
    
    // Listen for custom auth events
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  console.log("isAuthenticated:", isAuthenticated);

  // Protected route loader function
  const protectedLoader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return redirect('/login');
    }
    return null;
  };

  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: '/',
          element: isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to='/login'/>,
        },
        {
          path: 'login',
          element: isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        },
        {
          path: 'register',
          element: isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
        },
        {
          path: 'dashboard',
          element: isAuthenticated ? <Dashboard /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'profile',
          element: isAuthenticated ? <Profile /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'quiz',
          element: isAuthenticated ? <QuizGenerator /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'simulations',
          element: isAuthenticated ? <Simulations /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'simulation/:slug',
          element: isAuthenticated ? <SimulationView /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'learn-animations',
          element: isAuthenticated ? <LearnViaAnimations /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'community',
          element: isAuthenticated ? <Community /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'daily-question',
          element: isAuthenticated ? <DailyQuestion /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'notes',
          element: isAuthenticated ? <Notes /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'note/:slug',
          element: isAuthenticated ? <NoteView /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'badges',
          element: isAuthenticated ? <BadgesGrid /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'interactive-learning',
          element: isAuthenticated ? <InteractiveLearning /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'leaderboard',
          element: isAuthenticated ? <LeaderboardPage /> : <Navigate to="/login" />,
          loader: protectedLoader
        },
        {
          path: 'resources',
          element: isAuthenticated ? <Resources /> : <Navigate to="/login" />,
          loader: protectedLoader
        }
      ]
    }
  ]);

  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
