import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const StudentRegister = () => {
  const { registerStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    password: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!formData.fullName.trim()) tempErrors.fullName = 'Full Name is required';
    
    if (!formData.email.trim()) tempErrors.email = 'University Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = 'Please enter a valid email address';

    if (!formData.studentId.trim()) tempErrors.studentId = 'Student ID is required';

    if (!formData.password) tempErrors.password = 'Password is required';
    else if (formData.password.length < 6) tempErrors.password = 'Password must be at least 6 characters';

    if (!formData.phone.trim()) tempErrors.phone = 'Phone Number is required';

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

    if (!validate()) return;

    setLoading(true);
    try {
      await registerStudent(formData);
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      setServerError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-card">
        <h2 className="auth-title">Student <span className="gradient-text">Registration</span></h2>
        <p className="auth-subtitle">Create your account to start sharing your skills and earning</p>

        {serverError && <div className="alert alert-danger">{serverError}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name *</label>
            <input
              className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <span className="validation-error">⚠️ {errors.fullName}</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="email">University Email *</label>
              <input
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                type="email"
                id="email"
                name="email"
                placeholder="e.g. name@std.university.lk"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="validation-error">⚠️ {errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="studentId">Student ID / Reg No *</label>
              <input
                className={`form-input ${errors.studentId ? 'input-error' : ''}`}
                type="text"
                id="studentId"
                name="studentId"
                placeholder="e.g. UWU/ICT/20/001"
                value={formData.studentId}
                onChange={handleChange}
              />
              {errors.studentId && <span className="validation-error">⚠️ {errors.studentId}</span>}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password *</label>
              <input
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                type="password"
                id="password"
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="validation-error">⚠️ {errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <input
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
                type="text"
                id="phone"
                name="phone"
                placeholder="e.g. +94 77 123 4567"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <span className="validation-error">⚠️ {errors.phone}</span>}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register as Student'}
          </button>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
