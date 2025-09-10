import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Gamepad2, Sparkles } from 'lucide-react';
import '../assets/theme.css'; // Import the theme

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(formData);
    if (result.success) {
      navigate(from, { replace: true });
    }
    setIsLoading(false);
  };

  return (
    <div className="gamify-fadein" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-bg)', paddingTop: '5.5rem' }}>
      <div className="gamify-card" style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
        <div className="gamify-title">
          <Gamepad2 className="gamify-icon" />
          Welcome Back, Explorer!
        </div>
        <div className="gamify-subtitle">
          Continue your learning adventure
        </div>
        {error && (
          <div className="gamify-error flex items-center space-x-2">
            <Sparkles className="gamify-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="email">
              <Mail className="gamify-icon" /> Email Address
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
            />
          </div>

          {/* Password Field */}
          <div className="gamify-input-group">
            <label className="gamify-label" htmlFor="password">
              <Lock className="gamify-icon" /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                className="gamify-input"
                placeholder="Enter your password"
                required
                style={{ paddingRight: 40 }}
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

          {/* Progress Bar (optional, for gamified feel) */}
          <div className="gamify-progress">
            <div className="gamify-progress-bar" style={{ width: '40%' }} />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="gamify-btn"
          >
            {isLoading ? (
              <span>Starting Adventure...</span>
            ) : (
              <>
                <Sparkles className="gamify-icon" />
                Start Adventure
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <span style={{ color: '#fff' }}>
            New to the quest?{' '}
            <Link to="/register" className="gamify-link">
              Create Your Character
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;