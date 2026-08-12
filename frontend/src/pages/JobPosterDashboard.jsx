import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const JobPosterDashboard = () => {
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-wrapper">
        <div>
          <h1 className="dashboard-title">Manage <span className="gradient-text">Gigs</span></h1>
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
          <h3>Post a New <span className="gradient-text">Project Request</span></h3>
          <p className="form-helper-text">Enter project details and budget. Students will see and apply to this job.</p>
          
          {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

          <form onSubmit={handleSubmit} className="new-job-form">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Job Title *</label>
              <input
                className={`form-input ${formErrors.title ? 'input-error' : ''}`}
                type="text"
                id="title"
                name="title"
                placeholder="e.g. Develop a React portfolio website"
                value={formData.title}
                onChange={handleChange}
              />
              {formErrors.title && <span className="validation-error">⚠️ {formErrors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Job Description *</label>
              <textarea
                className={`form-input form-textarea ${formErrors.description ? 'input-error' : ''}`}
                id="description"
                name="description"
                placeholder="Write a clear summary of what needs to be done..."
                value={formData.description}
                onChange={handleChange}
              />
              {formErrors.description && <span className="validation-error">⚠️ {formErrors.description}</span>}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="requirements">Requirements / Skills needed *</label>
                <input
                  className={`form-input ${formErrors.requirements ? 'input-error' : ''}`}
                  type="text"
                  id="requirements"
                  name="requirements"
                  placeholder="e.g. React, HTML, CSS, Figma"
                  value={formData.requirements}
                  onChange={handleChange}
                />
                {formErrors.requirements && <span className="validation-error">⚠️ {formErrors.requirements}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priceRange">Price Range / Budget *</label>
                <input
                  className={`form-input ${formErrors.priceRange ? 'input-error' : ''}`}
                  type="text"
                  id="priceRange"
                  name="priceRange"
                  placeholder="e.g. LKR 15,000 - 25,000 or $50 - $100"
                  value={formData.priceRange}
                  onChange={handleChange}
                />
                {formErrors.priceRange && <span className="validation-error">⚠️ {formErrors.priceRange}</span>}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary publish-submit-btn" 
              disabled={formLoading}
            >
              {formLoading ? 'Publishing...' : 'Publish Gig'}
            </button>
          </form>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <h2 className="section-title">Your Published <span className="gradient-text font-normal">Gigs</span></h2>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Retrieving your projects...</p>
        </div>
      ) : myJobs.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">💼</span>
          <h3>No Gigs Published Yet</h3>
          <p>Click "Post a New Gig" above to start hiring university students.</p>
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
  );
};

export default JobPosterDashboard;
