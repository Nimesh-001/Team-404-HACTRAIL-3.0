import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const StudentDashboard = () => {
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-wrapper">
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">Available <span className="gradient-text">Gigs</span></h1>
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
          <p>Scanning the network for open projects...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">📁</span>
          <h3>No Gigs Found</h3>
          <p>{searchTerm ? 'Try adjusting your search terms' : 'No industry partners have posted any projects yet. Check back soon!'}</p>
        </div>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-card glass-card">
              <div className="job-card-header">
                <div>
                  <span className="client-tag">🏢 {job.postedBy?.fullName}</span>
                  <h3 className="job-title">{job.title}</h3>
                </div>
                <div className="job-budget-badge">
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
                <span className="post-date">Posted on {formatDate(job.createdAt)}</span>
                <button className="btn btn-primary apply-btn">Send Proposal</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
