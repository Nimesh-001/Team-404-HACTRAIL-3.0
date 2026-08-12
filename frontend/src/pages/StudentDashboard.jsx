import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiUser, FiLogOut, FiCode, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/api/jobs');
      setJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const titleMatch = job.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const reqMatch = job.requirements?.toLowerCase().includes(searchTerm.toLowerCase());
    const posterMatch = job.postedBy?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || descMatch || reqMatch || posterMatch;
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const greeting = new Date().getHours() < 12 ? 'Good Morning' : (new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening');

  return (
    <div className="dashboard-layout-wrapper">
      {/* Sidebar Navigation */}
      <div className="sidebar-card">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            <span>{user?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="sidebar-info">
            <span className="sidebar-name">{user?.fullName || 'Student'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>💻 Student</span>
          </div>
        </div>

        <div className="sidebar-menu-group">
          <span className="sidebar-menu-label">General</span>
          <Link to="/student-dashboard" className="sidebar-menu-item active">
            <FiGrid className="sidebar-icon" /> Dashboard
          </Link>
          <Link to="/profile" className="sidebar-menu-item">
            <FiUser className="sidebar-icon" /> My Profile
          </Link>
          <button onClick={logout} className="sidebar-menu-item" style={{ marginTop: 'auto' }}>
            <FiLogOut className="sidebar-icon" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content-area">
        <div className="dashboard-container" style={{ padding: 0 }}>
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
              {greeting}, {user?.fullName || 'Kasun'} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Here is your student dashboard overview for today.
            </p>
          </div>

          {/* Visual Stats Row */}
          <div className="dashboard-stats-row">
            <div className="stat-card stat-blue">
              <span className="stat-icon"><FiCode className="stat-icon-svg" /></span>
              <div className="stat-details">
                <span className="stat-label">Skills Showcase</span>
                <span className="stat-value">5 Verified</span>
              </div>
            </div>
            <div className="stat-card stat-indigo">
              <span className="stat-icon"><FiBriefcase className="stat-icon-svg" /></span>
              <div className="stat-details">
                <span className="stat-label">Applied Gigs</span>
                <span className="stat-value">8 Projects</span>
              </div>
            </div>
            <div className="stat-card stat-green">
              <span className="stat-icon"><FiDollarSign className="stat-icon-svg" /></span>
              <div className="stat-details">
                <span className="stat-label">Total Earnings</span>
                <span className="stat-value">Rs. 12,500</span>
              </div>
            </div>
          </div>

          <div className="dashboard-header-wrapper" style={{ marginTop: '3rem' }}>
            <div className="dashboard-header-text">
              <h1 className="dashboard-title" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Available <span className="gradient-text">Gigs</span></h1>
              <p className="dashboard-subtitle">Browse available project requests published by industry partners</p>
            </div>
            <div className="search-bar-container">
              <input
                className="form-input search-input"
                type="text"
                placeholder="🔍 Search by title, skills, or partner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading available gigs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">💼</span>
              <h3>No matching gigs found</h3>
              <p>Try adjusting your search criteria or look back later for new listings.</p>
            </div>
          ) : (
            <div className="jobs-list">
              {filteredJobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <span className="client-tag">{job.clientName || 'Industry Partner'}</span>
                      <h2 className="job-title">{job.title}</h2>
                    </div>
                    <span className="job-budget-badge">
                      Rs. {job.budget?.toLocaleString() || '15,000'}
                    </span>
                  </div>

                  <div className="job-card-body">
                    <p className="job-desc">{job.description}</p>
                    <div className="job-reqs">
                      <strong>Requirements:</strong>
                      <p>{job.requirements}</p>
                    </div>
                  </div>

                  <div className="job-card-footer">
                    <span className="post-date">Posted on {formatDate(job.createdAt)}</span>
                    <button className="btn btn-primary apply-btn">Send Proposal</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
