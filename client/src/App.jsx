import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, redirect } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RootLayout from './components/RootLayout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ErrorPage from './components/ErrorPage';
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
        // Add more protected routes as needed
        // {
        //   path: 'profile',
        //   element: isAuthenticated ? <Profile /> : <Navigate to="/login" />,
        //   loader: protectedLoader
        // },
      ]
    }
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
