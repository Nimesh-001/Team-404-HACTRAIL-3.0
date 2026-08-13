import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('earn'); // earn, internship, scholarship, mentor
  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  
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

  // Profile Edit modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editSkills, setEditSkills] = useState([]);
  const [editPhoto, setEditPhoto] = useState('');

  const AVAILABLE_SKILLS = [
    'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 
    'HTML/CSS', 'JavaScript', 'SQL', 'Figma', 'Git', 'UI/UX', 'Machine Learning'
  ];

  useEffect(() => {
    if (profileData) {
      setEditGithub(profileData.githubLink || '');
      setEditLinkedin(profileData.linkedinLink || '');
      setEditPhoto(profileData.profilePhoto || '');
      const parsedSkills = profileData.skills 
        ? profileData.skills.split(',').map(s => s.trim()).filter(Boolean) 
        : [];
      setEditSkills(parsedSkills);
      setEditPassword('');
    }
  }, [showProfileModal, profileData]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      const skillsString = editSkills.join(', ');
      const res = await API.put('/api/profile/student', {
        githubLink: editGithub,
        linkedinLink: editLinkedin,
        skills: skillsString,
        password: editPassword,
        bio: profileData?.bio || '',
        profilePhoto: editPhoto
      });
      setSuccess(res.data.message || 'Profile updated successfully!');
      setShowProfileModal(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Bell dropdown trigger state
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [adminMsgText, setAdminMsgText] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  useEffect(() => {
    fetchInbox();
    fetchProfile();
    fetchMyApplications();
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

  const fetchProfile = async () => {
    try {
      const res = await API.get('/api/profile');
      setProfileData(res.data);
      if (res.data?.linkedinLink) {
        setLinkedinUrl(res.data.linkedinLink);
      }
    } catch (err) {
      console.error("Failed to load profile details", err);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await API.get('/api/jobs/applications/my');
      setMyApplications(res.data || []);
    } catch (err) {
      console.error("Failed to load applications", err);
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

  const handleOpenApplyModal = (job) => {
    setError('');
    setSuccess('');
    setModalError('');
    setLinkedinUrl(profileData?.linkedinLink || '');
    setCoverLetter('');
    setActiveJob(job);
    setShowModal(true);
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
      fetchMyApplications(); // reload wallet
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSendMessageToAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!adminMsgText.trim()) return;
    try {
      await API.post('/api/messages/to-admin', { messageContent: adminMsgText });
      setSuccess('Your message has been sent successfully to the platform administrator!');
      setAdminMsgText('');
      setShowBellDropdown(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to send message to admin.');
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

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const clean = priceStr.replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
  };

  const unreadCount = messages.filter(m => !m.read).length;

  // Wallet and rating calculations
  const closedSelectedApps = myApplications.filter(app => app.status === 'SELECTED' && app.jobPost?.status === 'CLOSED');
  const totalEarningsVal = closedSelectedApps.reduce((sum, app) => sum + parsePrice(app.jobPost?.priceRange), 0);

  const ratedApps = myApplications.filter(app => app.rating !== null && app.rating !== undefined && app.rating > 0);
  const totalRatingsCount = ratedApps.length;
  const averageRating = totalRatingsCount > 0 
    ? (ratedApps.reduce((sum, app) => sum + app.rating, 0) / totalRatingsCount).toFixed(1)
    : null;

  return (
    <div className="dashboard-container">
      {/* Tabs and search layout */}
      <div className="dashboard-header-wrapper">
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">University <span className="gradient-text">Opportunities</span></h1>
          <p className="dashboard-subtitle">Apply for student jobs, internships, scholarships, and mentor slots.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="search-bar-container">
          
          {/* Profile Edit Avatar Icon */}
          <div 
            onClick={() => setShowProfileModal(true)}
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              cursor: 'pointer', 
              border: '2px solid var(--border-color)', 
              background: 'var(--bg-card)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            className="profile-avatar-icon-btn"
            title="Edit Profile Settings"
          >
            {profileData?.profilePhoto ? (
              <img src={profileData.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.25rem' }}>👤</span>
            )}
          </div>

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
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                
                {/* Send message to Admin Form inside notification bell dropdown */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 600 }}>Message Platform Administrator</h5>
                  <form onSubmit={handleSendMessageToAdmin}>
                    <textarea 
                      className="form-input" 
                      style={{ fontSize: '0.75rem', padding: '0.4rem', height: '50px', margin: '0 0 0.5rem 0', minHeight: '50px', background: 'var(--bg-dark)' }} 
                      placeholder="Ask administrative questions..."
                      value={adminMsgText}
                      onChange={e => setAdminMsgText(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}>
                      Send Message to Admin
                    </button>
                  </form>
                </div>
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

      {/* Student Wallet / Total Earnings Card */}
      <div className="economic-impact-card glass-card" style={{ marginBottom: '2rem', textAlign: 'left', background: 'rgba(254, 218, 106, 0.05)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>💰</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Your Completed Earnings</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Verifiable payouts accumulated from closed project hires.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {averageRating && (
              <div style={{ textAlign: 'right', borderRight: '1px solid var(--border-color)', paddingRight: '2rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Average Rating:</span>
                <strong style={{ fontSize: '1.35rem', color: 'var(--secondary)' }}>⭐ {averageRating} / 5.0</strong>
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 800 }} className="gradient-text">
                {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(totalEarningsVal)}
              </h2>
            </div>
          </div>
        </div>
        
        {closedSelectedApps.length > 0 && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payout Acquittance History:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {closedSelectedApps.map(app => (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'var(--bg-dark)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span>
                    💼 {app.jobPost?.title}
                    {app.rating && <span style={{ marginLeft: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>⭐ {app.rating} / 5</span>}
                  </span>
                  <strong style={{ color: 'var(--success)' }}>+ {app.jobPost?.priceRange} (Received ✓)</strong>
                </div>
              ))}
            </div>
          </div>
        )}
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
        <button 
          className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          📋 My Portfolio
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Scanning the network for open listings...</p>
        </div>
      ) : activeTab === 'portfolio' ? (
        <div className="table-view glass-card animate-fade printable-report-area" style={{ textAlign: 'left', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.75rem' }} className="gradient-text">My Performance Portfolio</h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verified academic and gig contribution report card.</p>
            </div>
            <button onClick={() => window.print()} className="btn btn-outline btn-sm no-print">
              🖨️ Print Portfolio Report
            </button>
          </div>

          {/* Student Profile Card block inside report */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Full Name</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profileData?.fullName || ''}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Student ID (TG Number)</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profileData?.studentId || profileData?.username || ''}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total Earnings (SkillBridge)</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--success)' }}>
                {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(totalEarningsVal)}
              </strong>
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Contributed Projects & Gigs ({closedSelectedApps.length})</h3>

          {closedSelectedApps.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <span className="empty-icon">📂</span>
              <h3>No Completed Projects Yet</h3>
              <p>Apply for open job listings, deliver high-quality work, and get verified and rated to build your portfolio!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="admin-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Project / Gig Title</th>
                    <th>Compensation Rate</th>
                    <th>Partner / Client</th>
                    <th>Rating Given</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {closedSelectedApps.map(app => (
                    <tr key={app.id}>
                      <td><strong>{app.jobPost?.title}</strong></td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{app.jobPost?.priceRange}</td>
                      <td>{app.jobPost?.postedBy?.fullName || 'University Admin'}</td>
                      <td>
                        {app.rating ? (
                          <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                            {"⭐".repeat(app.rating)} ({app.rating} / 5)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unrated / Pending</span>
                        )}
                      </td>
                      <td>
                        <span className="status-pill status-active" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'rgb(5, 150, 105)' }}>
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                  <span className="client-tag">
                    🏢 Posted by: {job.postedBy?.fullName} ({job.postedBy?.role === 'ROLE_ADMIN' ? 'University Administrator' : 'Industry Partner'})
                  </span>
                  <h3 className="job-title" style={{ marginTop: '0.4rem' }}>{job.title}</h3>
                  
                  {job.type === 'JOB' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>👥 Vacancies: <strong>{job.vacancies || 1}</strong></span>
                      <span>📥 Applicants: <strong>{job.applicationCount || 0} / {job.maxApplications || 100}</strong></span>
                    </div>
                  )}
                </div>
                {job.type === 'JOB' ? (
                  <div className="job-budget-badge">
                    {job.priceRange}
                  </div>
                ) : (
                  <div className="job-budget-badge" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    External Apply
                  </div>
                )}
              </div>
              
              <div className="job-card-body">
                {job.type !== 'JOB' && job.bankSlip && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <img src={job.bankSlip} alt="Opportunity Banner" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} />
                  </div>
                )}

                <p className="job-desc">{job.description}</p>
                
                {job.type === 'JOB' && (
                  <div className="job-reqs">
                    <strong>Requirements:</strong>
                    <p>{job.requirements}</p>
                  </div>
                )}
              </div>

              <div className="job-card-footer">
                <span className="post-date">Published on {formatDate(job.createdAt)}</span>
                {job.type === 'JOB' ? (
                  job.applicationCount >= job.maxApplications ? (
                    <button className="btn btn-secondary apply-btn" disabled>
                      Applications Full
                    </button>
                  ) : (
                    <button onClick={() => handleOpenApplyModal(job)} className="btn btn-primary apply-btn">
                      Send Application
                    </button>
                  )
                ) : (
                  job.websiteLink && (
                    <a 
                      href={job.websiteLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary apply-btn"
                      style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                    >
                      Apply on Official Website ↗
                    </a>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Opportunity Application Modal */}
      {showModal && activeJob && (
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
                    <strong>{profileData?.fullName || ''}</strong>
                  </div>
                  <div className="readonly-info-item">
                    Student ID (TG)
                    <strong>{profileData?.studentId || profileData?.username || ''}</strong>
                  </div>
                  <div className="readonly-info-item">
                    University Email
                    <strong>{profileData?.email || ''}</strong>
                  </div>
                  <div className="readonly-info-item">
                    Contact Number
                    <strong>{profileData?.phone || ''}</strong>
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

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile Settings</h3>
              <button className="close-modal-btn" onClick={() => setShowProfileModal(false)}>×</button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              {/* Read-Only Locked Fields */}
              <div className="form-readonly-info" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Locked Account Details</h4>
                <div className="readonly-info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div className="readonly-info-item">
                    Full Name
                    <strong>{profileData?.fullName || ''}</strong>
                  </div>
                  <div className="readonly-info-item">
                    Student ID (TG)
                    <strong>{profileData?.studentId || profileData?.username || ''}</strong>
                  </div>
                  <div className="readonly-info-item">
                    University Email
                    <strong>{profileData?.email || ''}</strong>
                  </div>
                  <div className="readonly-info-item">
                    Department
                    <strong>{profileData?.department || 'N/A'}</strong>
                  </div>
                  <div className="readonly-info-item">
                    Year of Study
                    <strong>{profileData?.yearOfStudy || 'N/A'}</strong>
                  </div>
                  <div className="readonly-info-item">
                    Contact Number
                    <strong>{profileData?.phone || ''}</strong>
                  </div>
                </div>
              </div>

              {/* Password update (Editable) */}
              <div className="form-group">
                <label className="form-label" htmlFor="editPassword">Change Password (Leave blank to keep current)</label>
                <input
                  className="form-input"
                  type="password"
                  id="editPassword"
                  placeholder="Enter new password if you wish to change it..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              {/* Profile Photo Upload Field (Editable) */}
              <div className="form-group">
                <label className="form-label" htmlFor="editPhoto">Profile Photo</label>
                <input
                  className="form-input"
                  type="file"
                  id="editPhoto"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditPhoto(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {editPhoto && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img 
                      src={editPhoto} 
                      alt="Preview" 
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} 
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Image ready to upload</span>
                  </div>
                )}
              </div>

              {/* GitHub Link (Editable) */}
              <div className="form-group">
                <label className="form-label" htmlFor="editGithub">GitHub Profile Link</label>
                <input
                  className="form-input"
                  type="url"
                  id="editGithub"
                  placeholder="https://github.com/yourusername"
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                />
              </div>

              {/* LinkedIn Link (Editable) */}
              <div className="form-group">
                <label className="form-label" htmlFor="editLinkedin">LinkedIn Profile Link</label>
                <input
                  className="form-input"
                  type="url"
                  id="editLinkedin"
                  placeholder="https://linkedin.com/in/yourusername"
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                />
              </div>

              {/* Skills selection checkboxes (Editable) */}
              <div className="form-group">
                <label className="form-label">Select Core Skills / Technologies</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', maxHeight: '180px', overflowY: 'auto' }}>
                  {AVAILABLE_SKILLS.map(skill => {
                    const isChecked = editSkills.includes(skill);
                    return (
                      <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditSkills(prev => [...prev, skill]);
                            } else {
                              setEditSkills(prev => prev.filter(s => s !== skill));
                            }
                          }}
                        />
                        <span>{skill}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
