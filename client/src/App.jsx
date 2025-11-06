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

  // Protected route loader function
  const protectedLoader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return redirect('/login');
    }
    return null;
  };

  // Create router once - stable reference
  const router = React.useMemo(() => createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: '/',
          element: <Navigate to='/login' replace />,
        },
        {
          path: 'login',
          element: <Login />
        },
        {
          path: 'register',
          element: <Register />
        },
        {
          path: 'dashboard',
          element: <Dashboard />,
          loader: protectedLoader
        },
        {
          path: 'profile',
          element: <Profile />,
          loader: protectedLoader
        },
        {
          path: 'quiz',
          element: <QuizGenerator />,
          loader: protectedLoader
        },
        {
          path: 'simulations',
          element: <Simulations />,
          loader: protectedLoader
        },
        {
          path: 'simulation/:slug',
          element: <SimulationView />,
          loader: protectedLoader
        },
        {
          path: 'learn-animations',
          element: <LearnViaAnimations />,
          loader: protectedLoader
        },
        {
          path: 'community',
          element: <Community />,
          loader: protectedLoader
        },
        {
          path: 'daily-question',
          element: <DailyQuestion />,
          loader: protectedLoader
        },
        {
          path: 'notes',
          element: <Notes />,
          loader: protectedLoader
        },
        {
          path: 'note/:slug',
          element: <NoteView />,
          loader: protectedLoader
        },
        {
          path: 'badges',
          element: <BadgesGrid />,
          loader: protectedLoader
        },
        {
          path: 'interactive-learning',
          element: <InteractiveLearning />,
          loader: protectedLoader
        },
        {
          path: 'leaderboard',
          element: <LeaderboardPage />,
          loader: protectedLoader
        },
        {
          path: 'resources',
          element: <Resources />,
          loader: protectedLoader
        }
      ]
    }
  ]), []);

  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
