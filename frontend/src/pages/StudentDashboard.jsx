import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('earn'); // earn, internship, scholarship, mentor
  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [messages, setMessages] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal and application states
  const [showModal, setShowModal] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Bell dropdown trigger state
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'earn') {
        const res = await API.get('/api/jobs?type=JOB');
        setJobs(res.data);
      } else if (activeTab === 'internship') {
        const res = await API.get('/api/jobs?type=INTERNSHIP');
        setJobs(res.data);
      } else if (activeTab === 'scholarship') {
        const res = await API.get('/api/jobs?type=SCHOLARSHIP');
        setJobs(res.data);
      } else if (activeTab === 'mentor') {
        const res = await API.get('/api/mentor-programs');
        setMentors(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve opportunities.');
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

  const handleApplyMentorship = async (programId) => {
    setError('');
    setSuccess('');
    try {
      const res = await API.post(`/api/mentor-programs/${programId}/apply`);
      setSuccess(res.data.message || 'Mentorship application submitted successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenApplyModal = async (job) => {
    setError('');
    setSuccess('');
    setModalError('');
    setLinkedinUrl('');
    setCoverLetter('');
    setActiveJob(job);
    
    try {
      const res = await API.get('/api/profile');
      const profile = res.data;
      setProfileData(profile);
      if (profile.linkedinLink) {
        setLinkedinUrl(profile.linkedinLink);
      }
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve profile details.');
    }
  };

  const handleSendApplication = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!linkedinUrl.trim()) {
      setModalError('LinkedIn profile link is required.');
      return;
    }
    
    setModalLoading(true);
    try {
      const res = await API.post(`/api/jobs/${activeJob.id}/apply`, {
        linkedinUrl,
        coverLetter
      });
      setSuccess(res.data.message || 'Your application has been submitted successfully!');
      setShowModal(false);
      fetchInitialData(); // reload values
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const titleMatch = job.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const reqMatch = job.requirements?.toLowerCase().includes(searchTerm.toLowerCase());
    const posterMatch = job.postedBy?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || descMatch || reqMatch || posterMatch;
  });

  const filteredMentors = mentors.filter((m) => {
    const titleMatch = m.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const mentorMatch = m.mentorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const schoolMatch = m.school?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || descMatch || mentorMatch || schoolMatch;
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="dashboard-container">
      {/* Tabs and search layout */}
      <div className="dashboard-header-wrapper">
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">University <span className="gradient-text">Opportunities</span></h1>
          <p className="dashboard-subtitle">Apply for student jobs, internships, scholarships, and mentor slots.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="search-bar-container">
          {/* Notification Bell Icon */}
          <div className="notification-bell-container" style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowBellDropdown(!showBellDropdown)} 
              className="btn btn-outline" 
              style={{ padding: '0.75rem 1rem', fontSize: '1.25rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              🔔 {unreadCount > 0 && <span className="bell-badge-count">{unreadCount}</span>}
            </button>
            
            {showBellDropdown && (
              <div className="bell-dropdown-list glass-card" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem', width: '320px', zIndex: 999, padding: '1rem', textAlign: 'left' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Notifications</h4>
                {messages.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No notifications yet.</p>
                ) : (
                  <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {messages.map(m => (
                      <div key={m.id} className={`bell-message-item ${m.read ? 'read' : 'unread'}`} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: m.read ? '#fff' : '#fcfcfc', borderLeft: m.read ? '1px solid var(--border-color)' : '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>System Alert</span>
                          <span>{formatDate(m.sentAt)}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>{m.messageContent}</p>
                        {!m.read && (
                          <button 
                            onClick={() => handleMarkAsRead(m.id)} 
                            className="btn btn-sm btn-outline read-btn-sm" 
                            style={{ marginTop: '0.4rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <input
            className="form-input search-input"
            type="text"
            placeholder="🔍 Search postings by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'earn' ? 'active' : ''}`}
          onClick={() => setActiveTab('earn')}
        >
          💰 Earn (Student Jobs)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'internship' ? 'active' : ''}`}
          onClick={() => setActiveTab('internship')}
        >
          💼 Internships
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scholarship' ? 'active' : ''}`}
          onClick={() => setActiveTab('scholarship')}
        >
          🎓 Scholarships
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mentor' ? 'active' : ''}`}
          onClick={() => setActiveTab('mentor')}
        >
          🏫 Mentor Programme
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Scanning the network for open listings...</p>
        </div>
      ) : activeTab === 'mentor' ? (
        filteredMentors.length === 0 ? (
          <div className="empty-state glass-card">
            <span className="empty-icon">🏫</span>
            <h3>No Mentorship Programs Available</h3>
            <p>Admin has not published mentor slots yet. Check back soon!</p>
          </div>
        ) : (
          <div className="jobs-list">
            {filteredMentors.map((m) => (
              <div key={m.id} className="job-card glass-card">
                <div className="job-card-header">
                  <div>
                    <span className="client-tag">🏫 {m.school}</span>
                    <h3 className="job-title">{m.title}</h3>
                    <p className="mentor-name-lead">Mentor: <strong>{m.mentorName}</strong></p>
                  </div>
                </div>
                
                <div className="job-card-body">
                  <p className="job-desc">{m.description}</p>
                </div>

                <div className="job-card-footer">
                  <span className="post-date">Published on {formatDate(m.createdAt)}</span>
                  <button 
                    onClick={() => handleApplyMentorship(m.id)} 
                    className="btn btn-primary apply-btn"
                  >
                    Apply for Mentorship
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">📁</span>
          <h3>No Listings Found</h3>
          <p>{searchTerm ? 'Try adjusting your search terms' : 'No approved opportunities are available in this category yet.'}</p>
        </div>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-card glass-card">
              <div className="job-card-header">
                <div>
                  <span className="client-tag">🏢 {job.postedBy?.fullName}</span>
                  <h3 className="job-title">{job.title}</h3>
                  
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>👥 Vacancies: <strong>{job.vacancies || 1}</strong></span>
                    <span>📥 Applicants: <strong>{job.applicationCount || 0} / {job.maxApplications || 100}</strong></span>
                  </div>
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
                {job.applicationCount >= job.maxApplications ? (
                  <button className="btn btn-secondary apply-btn" disabled>
                    Applications Full
                  </button>
                ) : (
                  <button onClick={() => handleOpenApplyModal(job)} className="btn btn-primary apply-btn">
                    Send Proposal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Opportunity Application Modal */}
      {showModal && activeJob && profileData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Apply for {activeJob.title}</h3>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={handleSendApplication}>
              <div className="form-readonly-info">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Prefilled Profile Details</h4>
                <div className="readonly-info-grid">
                  <div className="readonly-info-item">
                    Full Name
                    <strong>{profileData.fullName}</strong>
                  </div>
                  <div className="readonly-info-item">
                    Student ID / Reg No
                    <strong>{profileData.studentId || profileData.username}</strong>
                  </div>
                  <div className="readonly-info-item" style={{ gridColumn: 'span 2' }}>
                    University Email
                    <strong>{profileData.email}</strong>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="linkedinUrl">LinkedIn Profile Link *</label>
                <input
                  className="form-input"
                  type="url"
                  id="linkedinUrl"
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  required
                />
                <span className="form-helper-text" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  This field is mandatory. Prefilled from your settings if entered.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="coverLetter">Why are you a good fit? (Optional)</label>
                <textarea
                  className="form-input form-textarea"
                  id="coverLetter"
                  placeholder="Briefly explain your suitability for this gig..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="applications-quota-info">
                <span>Currently applied: <strong>{activeJob.applicationCount || 0} / {activeJob.maxApplications}</strong></span>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
