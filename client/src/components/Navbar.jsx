import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Star,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Crown,
  Zap
} from 'lucide-react';
import '../assets/theme.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav
      style={{
        width: '100vw', // full width
        left: 0,
        top: 0,
        position: 'fixed',
        background: 'linear-gradient(90deg, #181a2b 60%, #232946 100%)',
        borderBottom: '2px solid var(--neon-blue)',
        boxShadow: '0 0 16px var(--neon-blue)',
        zIndex: 1000
      }}
    >
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0.5rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <BookOpen className="gamify-icon" />
          <span style={{
            fontFamily: "'Orbitron', 'Audiowide', sans-serif",
            fontWeight: 700,
            fontSize: '1.5rem',
            color: 'var(--neon-blue)',
            textShadow: 'var(--text-glow)'
          }}>
            Rural <span style={{ color: 'var(--neon-pink)' }}>Quest</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="gamify-navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {user ? (
            <>
              {/* User Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', background: 'rgba(57,255,20,0.12)',
                  borderRadius: '1rem', padding: '0.3rem 1rem', color: 'var(--neon-green)', fontWeight: 700
                }}>
                  <Crown className="gamify-icon" />
                  Level {user.level || 1}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', background: 'rgba(0,234,255,0.12)',
                  borderRadius: '1rem', padding: '0.3rem 1rem', color: 'var(--neon-blue)', fontWeight: 700
                }}>
                  <Star className="gamify-icon" />
                  {user.points || 0} XP
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', background: 'rgba(255,0,204,0.12)',
                  borderRadius: '1rem', padding: '0.3rem 1rem', color: 'var(--neon-pink)', fontWeight: 700
                }}>
                  <Trophy className="gamify-icon" />
                  {user.achievements || 0}
                </div>
              </div>
              {/* Navigation Links */}
              <Link to="/dashboard" className="gamify-link" style={{ marginTop: 0 }}>
                <Zap className="gamify-icon" />
                Dashboard
              </Link>
              <Link to="/courses" className="gamify-link" style={{ marginTop: 0 }}>
                Courses
              </Link>
              <Link to="/leaderboard" className="gamify-link" style={{ marginTop: 0 }}>
                Leaderboard
              </Link>
              {/* User Profile Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', background: 'rgba(0,234,255,0.08)',
                    border: 'none', borderRadius: '1rem', padding: '0.5rem 1rem', color: '#fff',
                    fontFamily: "'Orbitron', 'Audiowide', sans-serif", fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <User className="gamify-icon" />
                  {user.name}
                </button>
                {/* You can add a dropdown here if needed */}
                <button
                  onClick={handleLogout}
                  className="gamify-link"
                  style={{ color: 'var(--neon-pink)', marginTop: 0, marginLeft: 16, border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  <LogOut className="gamify-icon" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <Link to="/login" className="gamify-link" style={{ marginTop: 0 }}>
                Login
              </Link>
              <Link to="/register" className="gamify-btn" style={{ width: 'auto', padding: '0.7rem 2rem', marginTop: 0 }}>
                Start Quest
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button (optional, not styled here) */}
        {/* ... */}
      </div>
    </nav>
  );
};

export default Navbar;