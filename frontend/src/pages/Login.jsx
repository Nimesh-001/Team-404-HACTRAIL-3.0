import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'ROLE_STUDENT') {
        navigate('/student-dashboard');
      } else if (user.role === 'ROLE_JOB_POSTER') {
        navigate('/job-poster-dashboard');
      }
    }
  }, [user, navigate]);

  // Show registration success message if redirected from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear location state so message doesn't persist on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const validate = () => {
    const tempErrors = {};
    if (!formData.username.trim()) tempErrors.username = 'Username or email is required';
    if (!formData.password) tempErrors.password = 'Password is required';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validate()) return;

    setLoading(true);
    try {
      const loggedInUser = await login(formData.username, formData.password);
      if (loggedInUser.role === 'ROLE_STUDENT') {
        navigate('/student-dashboard');
      } else if (loggedInUser.role === 'ROLE_JOB_POSTER') {
        navigate('/job-poster-dashboard');
      }
    } catch (err) {
      setServerError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card login-card glass-card">
        <h2 className="auth-title">Welcome <span className="gradient-text">Back</span></h2>
        <p className="auth-subtitle">Log in to access your dashboard</p>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {serverError && <div className="alert alert-danger">{serverError}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username or Email *</label>
            <input
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username or email"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <span className="validation-error">⚠️ {errors.username}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password *</label>
            <input
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <span className="validation-error">⚠️ {errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
