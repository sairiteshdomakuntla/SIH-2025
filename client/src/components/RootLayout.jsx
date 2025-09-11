import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import XPNotification from './XPNotification';
import { useSocket } from '../context/SocketContext';

const RootLayout = () => {
  const { xpNotification, clearXpNotification } = useSocket();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <Header />
      
      {/* Main Content - Outlet for child components */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* XP Notification */}
      <XPNotification 
        notification={xpNotification} 
        onClose={clearXpNotification}
      />
    </div>
  );
};

export default RootLayout;