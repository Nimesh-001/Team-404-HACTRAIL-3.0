import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const JobPosterDashboard = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Applicants view states
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicantsMap, setApplicantsMap] = useState({});
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  // New job form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    priceRange: '',
    type: 'JOB', // JOB, INTERNSHIP, SCHOLARSHIP
    vacancies: 1,
    maxApplications: 100,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchMyJobs();
    fetchInbox();
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

  const fetchInbox = async () => {
    try {
      const res = await API.get('/api/messages/my');
      setMessages(res.data || []);
    } catch (err) {
      console.error("Inbox load fail", err);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await API.put(`/api/messages/${messageId}/read`);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleApplicants = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }

    setExpandedJobId(jobId);
    setApplicantsLoading(true);
    try {
      const res = await API.get(`/api/jobs/${jobId}/applications`);
      setApplicantsMap(prev => ({ ...prev, [jobId]: res.data }));
    } catch (err) {
      console.error("Failed to load applicants", err);
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleSelectApplicant = async (applicationId, jobId) => {
    setError('');
    try {
      await API.put(`/api/jobs/applications/${applicationId}/select`);
      // Update local status
      setApplicantsMap(prev => {
        const list = prev[jobId] || [];
        return {
          ...prev,
          [jobId]: list.map(app => app.id === applicationId ? { ...app, status: 'SELECTED' } : app)
        };
      });
      // Refresh counts
      const response = await API.get('/api/jobs/my');
      setMyJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to select applicant.');
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.title.trim()) tempErrors.title = 'Title is required';
    if (!formData.description.trim()) tempErrors.description = 'Description is required';
    if (!formData.requirements.trim()) tempErrors.requirements = 'Requirements are required';
    if (!formData.priceRange.trim()) tempErrors.priceRange = 'Budget or price range is required';
    if (formData.vacancies <= 0) tempErrors.vacancies = 'Vacancies must be greater than 0';
    if (formData.maxApplications <= 0) tempErrors.maxApplications = 'Applications count limit must be greater than 0';

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
      setFormSuccess('Opportunity request published successfully!');
      setFormData({
        title: '',
        description: '',
        requirements: '',
        priceRange: '',
        type: 'JOB',
        vacancies: 1,
        maxApplications: 100,
      });
      setMyJobs((prev) => [response.data, ...prev]);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish opportunity.');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="dashboard-container">
      {/* Inbox Notification Bar */}
      {messages.length > 0 && (
        <div className="admin-inbox-section glass-card">
          <h3 className="inbox-title">✉️ Admin Inbox {unreadCount > 0 && <span className="unread-dot">{unreadCount} new</span>}</h3>
          <div className="messages-list-inbox">
            {messages.map(m => (
              <div key={m.id} className={`message-inbox-item ${m.read ? 'read' : 'unread'}`}>
                <div className="msg-header">
                  <span className="msg-from">From: Administrator</span>
                  <span className="msg-time">{formatDate(m.sentAt)}</span>
                </div>
                <p className="msg-body">{m.messageContent}</p>
                {!m.read && (
                  <button onClick={() => handleMarkAsRead(m.id)} className="btn btn-sm btn-outline read-btn-sm">
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-header-wrapper">
        <div>
          <h1 className="dashboard-title">Manage <span className="gradient-text">Gigs & Offers</span></h1>
          <p className="dashboard-subtitle">Create, monitor, and manage your published projects and offers</p>
        </div>
        <div>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '➕ Post a New Gig / Offer'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="job-form-wrapper glass-card">
          <h3>Post a New <span className="gradient-text">Project Request or Offer</span></h3>
          <p className="form-helper-text">Submit details and category. Listings will display on student feeds after moderator approval.</p>
          
          {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

          <form onSubmit={handleSubmit} className="new-job-form">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="title">Opportunity Title *</label>
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
                <label className="form-label" htmlFor="type">Opportunity Category *</label>
                <select
                  className="form-select"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="JOB">Job Gig (Earn)</option>
                  <option value="INTERNSHIP">Internship Opportunity</option>
                  <option value="SCHOLARSHIP">Scholarship Opportunity</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Detailed Description *</label>
              <textarea
                className={`form-input form-textarea ${formErrors.description ? 'input-error' : ''}`}
                id="description"
                name="description"
                placeholder="Write a clear summary of what is requested/offered..."
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
                <label className="form-label" htmlFor="priceRange">Compensation / Value / Budget *</label>
                <input
                  className={`form-input ${formErrors.priceRange ? 'input-error' : ''}`}
                  type="text"
                  id="priceRange"
                  name="priceRange"
                  placeholder="e.g. LKR 15,000 - 25,000 or $50 / hour"
                  value={formData.priceRange}
                  onChange={handleChange}
                />
                {formErrors.priceRange && <span className="validation-error">⚠️ {formErrors.priceRange}</span>}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="vacancies">Total Vacancies *</label>
                <input
                  className={`form-input ${formErrors.vacancies ? 'input-error' : ''}`}
                  type="number"
                  min="1"
                  id="vacancies"
                  name="vacancies"
                  value={formData.vacancies}
                  onChange={handleChange}
                />
                {formErrors.vacancies && <span className="validation-error">⚠️ {formErrors.vacancies}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="maxApplications">Max Applications Limit *</label>
                <input
                  className={`form-input ${formErrors.maxApplications ? 'input-error' : ''}`}
                  type="number"
                  min="1"
                  id="maxApplications"
                  name="maxApplications"
                  value={formData.maxApplications}
                  onChange={handleChange}
                />
                {formErrors.maxApplications && <span className="validation-error">⚠️ {formErrors.maxApplications}</span>}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary publish-submit-btn" 
              disabled={formLoading}
            >
              {formLoading ? 'Publishing...' : 'Publish Opportunity'}
            </button>
          </form>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <h2 className="section-title">Your Published <span className="gradient-text font-normal">Gigs & Offers</span></h2>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Retrieving your projects...</p>
        </div>
      ) : myJobs.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">💼</span>
          <h3>No Gigs Published Yet</h3>
          <p>Click "Post a New Gig / Offer" above to start hiring university students.</p>
        </div>
      ) : (
        <div className="jobs-list">
          {myJobs.map((job) => (
            <div key={job.id} className="job-card glass-card" style={{ display: 'block' }}>
              <div className="job-card-header">
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <span className={`role-badge ${job.type === 'JOB' ? 'role-student' : job.type === 'INTERNSHIP' ? 'role-poster' : 'status-pending'}`} style={{ marginTop: '0.25rem' }}>
                    {job.type === 'JOB' ? 'Job Gig' : job.type === 'INTERNSHIP' ? 'Internship' : 'Scholarship'}
                  </span>
                  
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>👥 Vacancies: <strong>{job.vacancies || 1}</strong></span>
                    <span>📥 Applicants: <strong>{job.applicationCount || 0} / {job.maxApplications || 100}</strong></span>
                  </div>
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

              <div className="job-card-footer" style={{ borderBottom: expandedJobId === job.id ? '1px solid var(--border-color)' : 'none', paddingBottom: expandedJobId === job.id ? '1rem' : '0' }}>
                <span className="post-date">Published on {formatDate(job.createdAt)}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`status-tag status-${job.status?.toLowerCase() || 'pending'}`}>
                    ● {job.status || 'PENDING'}
                  </span>
                  {job.status === 'APPROVED' && (
                    <button 
                      onClick={() => handleToggleApplicants(job.id)} 
                      className="btn btn-outline btn-sm"
                    >
                      {expandedJobId === job.id ? 'Hide Applicants' : `View Applicants (${job.applicationCount || 0})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Applicants Table */}
              {expandedJobId === job.id && (
                <div className="applicants-table-wrapper" style={{ marginTop: '1.5rem', overflowX: 'auto', textAlign: 'left' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Submitted Proposals</h4>
                  {applicantsLoading ? (
                    <p className="subtext">Retrieving proposals...</p>
                  ) : !applicantsMap[job.id] || applicantsMap[job.id].length === 0 ? (
                    <p className="subtext">No candidates have applied for this opportunity yet.</p>
                  ) : (
                    <table className="admin-table" style={{ width: '100%', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>LinkedIn link</th>
                          <th>Brief Cover Message</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicantsMap[job.id].map((app) => (
                          <tr key={app.id}>
                            <td>
                              <strong>{app.student?.fullName}</strong>
                              <div className="subtext">{app.student?.email}</div>
                              <div className="subtext">ID: {app.student?.studentId || app.student?.username}</div>
                            </td>
                            <td>
                              <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="gradient-text" style={{ fontWeight: 600 }}>
                                View Profile ↗
                              </a>
                            </td>
                            <td>{app.coverLetter || <em className="subtext">None provided</em>}</td>
                            <td>
                              <span className={`status-pill ${app.status === 'SELECTED' ? 'status-verified' : 'status-unverified'}`}>
                                {app.status}
                              </span>
                            </td>
                            <td>
                              {app.status === 'PENDING' ? (
                                <button 
                                  onClick={() => handleSelectApplicant(app.id, job.id)} 
                                  className="btn btn-sm btn-primary"
                                >
                                  Select Candidate
                                </button>
                              ) : (
                                <span className="subtext" style={{ color: 'var(--success)', fontWeight: 600 }}>Selected ✓</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobPosterDashboard;
