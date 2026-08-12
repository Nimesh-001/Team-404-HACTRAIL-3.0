import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiUser, FiLogOut, FiBriefcase, FiUsers, FiActivity } from 'react-icons/fi';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const JobPosterDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // New job form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    priceRange: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/api/jobs/my');
      setMyJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your jobs.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.title.trim()) tempErrors.title = 'Title is required';
    if (!formData.description.trim()) tempErrors.description = 'Description is required';
    if (!formData.requirements.trim()) tempErrors.requirements = 'Requirements are required';
    if (!formData.priceRange.trim()) tempErrors.priceRange = 'Budget or price range is required';

    setFormErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const response = await API.post('/api/jobs', formData);
      setFormSuccess('Project gig published successfully!');
      setFormData({
        title: '',
        description: '',
        requirements: '',
        priceRange: '',
      });
      setMyJobs((prev) => [response.data, ...prev]);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish job.');
    } finally {
      setFormLoading(false);
    }
  };

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
            <span className="sidebar-name">{user?.fullName || 'Partner'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>🏢 Partner</span>
          </div>
        </div>

        <div className="sidebar-menu-group">
          <span className="sidebar-menu-label">General</span>
          <Link to="/job-poster-dashboard" className="sidebar-menu-item active">
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
              {greeting}, {user?.fullName || 'Partner'} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Here is your organization's overview dashboard for today.
            </p>
          </div>

          {/* Visual Stats Row */}
          <div className="dashboard-stats-row">
            <div className="stat-card stat-blue">
              <span className="stat-icon"><FiBriefcase className="stat-icon-svg" /></span>
              <div className="stat-details">
                <span className="stat-label">Active Gigs</span>
                <span className="stat-value">{myJobs.length} Published</span>
              </div>
            </div>
            <div className="stat-card stat-indigo">
              <span className="stat-icon"><FiUsers className="stat-icon-svg" /></span>
              <div className="stat-details">
                <span className="stat-label">Total Applicants</span>
                <span className="stat-value">---</span>
              </div>
            </div>
            <div className="stat-card stat-green">
              <span className="stat-icon"><FiActivity className="stat-icon-svg" /></span>
              <div className="stat-details">
                <span className="stat-label">System Status</span>
                <span className="stat-value">Operational</span>
              </div>
            </div>
          </div>

          <div className="dashboard-header-wrapper" style={{ marginTop: '3rem' }}>
            <div>
              <h1 className="dashboard-title" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manage <span className="gradient-text">Gigs</span></h1>
              <p className="dashboard-subtitle">Create, monitor, and manage your published projects</p>
            </div>
            <div>
              <button
                className="btn btn-secondary"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Cancel' : '➕ Post a New Gig'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="job-form-wrapper glass-card">
              <h3 style={{ textAlign: 'left' }}>Post a New Project Request</h3>
              <p className="form-helper-text" style={{ textAlign: 'left' }}>Provide the details of the task you need university student developers to execute.</p>

              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

              <form onSubmit={handleSubmit} className="new-job-form" style={{ textAlign: 'left' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="title">Gig Title</label>
                  <input
                    className="form-input"
                    type="text"
                    id="title"
                    name="title"
                    placeholder="e.g. Develop React landing page, Java API integration"
                    value={formData.title}
                    onChange={handleChange}
                  />
                  {formErrors.title && <span className="validation-error">⚠️ {formErrors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Detailed Description</label>
                  <textarea
                    className="form-input form-textarea"
                    id="description"
                    name="description"
                    placeholder="Provide details about the project requirements, deliverables, milestones..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {formErrors.description && <span className="validation-error">⚠️ {formErrors.description}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="requirements">Required Skills & Tools</label>
                  <input
                    className="form-input"
                    type="text"
                    id="requirements"
                    name="requirements"
                    placeholder="e.g. React, Node.js, REST APIs"
                    value={formData.requirements}
                    onChange={handleChange}
                  />
                  {formErrors.requirements && <span className="validation-error">⚠️ {formErrors.requirements}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="priceRange">Budget / Price Range</label>
                  <input
                    className="form-input"
                    type="text"
                    id="priceRange"
                    name="priceRange"
                    placeholder="e.g. Rs. 15,000 - Rs. 20,000"
                    value={formData.priceRange}
                    onChange={handleChange}
                  />
                  {formErrors.priceRange && <span className="validation-error">⚠️ {formErrors.priceRange}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary publish-submit-btn"
                  disabled={formLoading}
                >
                  {formLoading ? 'Publishing Gig...' : 'Publish Gig to Network'}
                </button>
              </form>
            </div>
          )}

          {error && !showForm && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Scanning database for your listings...</p>
            </div>
          ) : myJobs.length === 0 ? (
            <div className="empty-state glass-card">
              <span className="empty-icon">📁</span>
              <h3>No Published Gigs</h3>
              <p>You haven't posted any student project gigs yet. Click the button above to publish your first one!</p>
            </div>
          ) : (
            <div className="jobs-list">
              {myJobs.map((job) => (
                <div key={job.id} className="job-card glass-card">
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
                    </div>
                    <div className="job-budget-badge budget-secondary">
                      {job.priceRange}
                    </div>
                  </div>

                  <div className="job-card-body">
                    <p className="job-desc">{job.description}</p>
                    <div className="job-reqs">
                      <strong>Requirements:</strong>
                      <p>{job.requirements}</p>
                    </div>
                  </div>

                  <div className="job-card-footer">
                    <span className="post-date">Published on {formatDate(job.createdAt)}</span>
                    <span className="status-tag status-active">● Active</span>
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

export default JobPosterDashboard;
