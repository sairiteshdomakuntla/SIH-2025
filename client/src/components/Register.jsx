import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  MapPin,
  BookOpen,
  Sparkles,
  Star,
  BadgeCheck
} from 'lucide-react';
import '../assets/theme.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    grade: '',
    interests: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const grades = ['5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade'];
  const subjects = ['Math', 'Science', 'English', 'Hindi', 'Social Studies', 'Arts'];

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      location: formData.location,
      grade: formData.grade,
      interests: formData.interests
    });

    if (result.success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  // Gamified XP bar (fake value for demo)
  const xpPercent = 10;

  return (
    <div className="gamify-fadein" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-bg)', paddingTop: '5.5rem' }}>
      <div className="gamify-card" style={{ width: '100%', maxWidth:580, position: 'relative' }}>
        {/* Top Icon */}
       

        {/* Gamified XP Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <span style={{
            fontWeight: 700,
            color: 'var(--neon-pink)',
            fontFamily: "'Orbitron', 'Audiowide', sans-serif",
            fontSize: '1.18rem',
            textAlign: 'center',
            letterSpacing: '0.04em',
            textShadow: '0 0 6px var(--neon-pink)'
          }}>
            <span style={{display:'flex'}}><BadgeCheck style={{marginRight:9}} />
            New Player
            </span>
          </span>
        </div>

        <div className="gamify-title">
          Create Your Learning Character!
        </div>
        <div className="gamify-subtitle">
          Begin your epic educational journey
        </div>
        <div className="gamify-tip" style={{ textAlign: 'center', marginBottom: 16 }}>
          <span role="img" aria-label="tip">💡</span> Tip: The more interests you select, the more XP you can earn!
        </div>
        {error && (
          <div className="gamify-error flex items-center space-x-2">
            <Sparkles className="gamify-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="name" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <User className="gamify-icon" style={{ marginBottom: 0 }} />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="gamify-input"
              placeholder="Enter your name"
              required
              style={{ marginTop: '0.2rem' }}
            />
          </div>
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <Mail className="gamify-icon" style={{ marginBottom: 0 }} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="gamify-input"
              placeholder="Enter your email"
              required
              style={{ marginTop: '0.2rem' }}
            />
          </div>
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <Lock className="gamify-icon" style={{ marginBottom: 0 }} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                className="gamify-input"
                placeholder="Create a password"
                required
                style={{ paddingRight: 40, marginTop: '0.2rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="gamify-icon" />
                ) : (
                  <Eye className="gamify-icon" />
                )}
              </button>
            </div>
          </div>
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="confirmPassword" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <Lock className="gamify-icon" style={{ marginBottom: 0 }} />
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="gamify-input"
                placeholder="Confirm your password"
                required
                style={{ paddingRight: 40, marginTop: '0.2rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="gamify-icon" />
                ) : (
                  <Eye className="gamify-icon" />
                )}
              </button>
            </div>
          </div>
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="location" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <MapPin className="gamify-icon" style={{ marginBottom: 0 }} />
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              className="gamify-input"
              placeholder="Your village/city"
              required
              style={{ marginTop: '0.2rem' }}
            />
          </div>
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="grade" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <BookOpen className="gamify-icon" style={{ marginBottom: 0 }} />
              Grade Level
            </label>
            <select
              name="grade"
              id="grade"
              value={formData.grade}
              onChange={handleChange}
              className="gamify-input"
              required
              style={{ marginTop: '0.2rem' }}
            >
              <option value="">Select your grade</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="gamify-input-group">
            <label className="gamify-label">
              Choose Your Learning Interests
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {subjects.map(subject => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleInterestToggle(subject)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '0.8rem',
                    border: formData.interests.includes(subject)
                      ? '2px solid var(--neon-pink)'
                      : '2px solid var(--neon-blue)',
                    background: formData.interests.includes(subject)
                      ? 'rgba(255,0,204,0.12)'
                      : 'rgba(0,234,255,0.08)',
                    color: formData.interests.includes(subject)
                      ? 'var(--neon-pink)'
                      : '#fff',
                    fontWeight: 600,
                    fontFamily: 'Orbitron, Audiowide, sans-serif',
                    cursor: 'pointer',
                    boxShadow: formData.interests.includes(subject)
                      ? '0 0 8px var(--neon-pink)'
                      : '0 0 4px var(--neon-blue)',
                    transition: 'all 0.2s'
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="gamify-btn"
            style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
          >
            {isLoading ? (
              <span>Creating Character...</span>
            ) : (
              <>
                <span style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Sparkles className="gamify-icon" style={{ marginRight: 6, marginLeft: 4, verticalAlign: 'middle' }} />
                </span>
                <span style={{ flex: 1, textAlign: 'center' }}>Begin My Quest!</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <span style={{ color: '#fff' }}>
            Already have an account?{' '}
            <Link to="/login" className="gamify-link">
              Continue Your Adventure
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;