import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, jobs, mentor, applications, messaging, report
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  
  // New Opportunity / Mentor form state
  const [publishType, setPublishType] = useState('MENTOR'); // MENTOR, INTERNSHIP, SCHOLARSHIP
  const [mentorData, setMentorData] = useState({
    title: '',
    description: '',
    school: '',
    mentorName: '',
  });
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    requirements: '',
    priceRange: '',
  });
  
  // Messaging form
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ROLE_STUDENT');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'overview') {
        const res = await API.get('/api/admin/stats');
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await API.get('/api/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'jobs') {
        const res = await API.get('/api/admin/jobs');
        setJobs(res.data);
      } else if (activeTab === 'applications') {
        const res = await API.get('/api/admin/mentor-applications');
        setApplications(res.data);
      } else if (activeTab === 'messaging') {
        const res = await API.get('/api/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'report') {
        const res = await API.get('/api/admin/selected-report');
        setSelectedReports(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve admin records.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToggle = async (userId, currentVerified) => {
    setSuccess('');
    setError('');
    try {
      const nextStatus = !currentVerified;
      const res = await API.put(`/api/admin/users/${userId}/verify?status=${nextStatus}`);
      setSuccess(res.data.message);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: nextStatus } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification status.');
    }
  };

  const handleStatusToggle = async (userId, currentActive) => {
    setSuccess('');
    setError('');
    try {
      const nextActive = !currentActive;
      const res = await API.put(`/api/admin/users/${userId}/status?active=${nextActive}`);
      setSuccess(res.data.message);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: nextActive } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleJobModeration = async (jobId, targetStatus) => {
    setSuccess('');
    setError('');
    try {
      const res = await API.put(`/api/admin/jobs/${jobId}/status?status=${targetStatus}`);
      setSuccess(res.data.message);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: targetStatus } : j));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to moderate gig posting.');
    }
  };

  const handlePublishOpportunity = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (publishType === 'MENTOR') {
      if (!mentorData.title || !mentorData.description || !mentorData.school || !mentorData.mentorName) {
        setError('All fields are required.');
        return;
      }
      try {
        const res = await API.post('/api/admin/mentor-programs', mentorData);
        setSuccess(res.data.message || 'Mentor program slot created successfully!');
        setMentorData({ title: '', description: '', school: '', mentorName: '' });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to create mentor program.');
      }
    } else {
      if (!jobData.title || !jobData.description || !jobData.requirements || !jobData.priceRange) {
        setError('All fields are required.');
        return;
      }
      try {
        const res = await API.post('/api/admin/jobs', {
          ...jobData,
          type: publishType
        });
        setSuccess(res.data.message || `${publishType} opportunity published successfully!`);
        setJobData({ title: '', description: '', requirements: '', priceRange: '' });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to publish opportunity.');
      }
    }
  };

  const handleModerateApplication = async (appId, targetStatus) => {
    setSuccess('');
    setError('');
    try {
      const res = await API.put(`/api/admin/mentor-applications/${appId}/status?status=${targetStatus}`);
      setSuccess(res.data.message);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: targetStatus } : a));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to moderate application.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!selectedRecipientId || !messageText.trim()) {
      setError('Please select a recipient and enter message text.');
      return;
    }
    try {
      const res = await API.post('/api/admin/messages', {
        recipientId: selectedRecipientId,
        messageContent: messageText,
      });
      setSuccess(res.data.message || 'Message sent successfully!');
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    }
  };

  const filteredUsersForMessaging = users.filter(u => u.role === roleFilter);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header-panel">
        <div>
          <h2 className="admin-title">System <span className="gradient-text">Administration</span></h2>
          <p className="admin-subtitle">Monitor university users, verify profiles, moderate postings, and publish direct opportunities.</p>
        </div>
      </div>
      
      <div className="admin-tab-nav-wrapper">
        <div className="admin-tab-nav">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Stats</button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
          <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>💼 Gigs Moderation</button>
          <button className={`tab-btn ${activeTab === 'mentor' ? 'active' : ''}`} onClick={() => setActiveTab('mentor')}>➕ Publish Listings</button>
          <button className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>🔔 Mentor Applications</button>
          <button className={`tab-btn ${activeTab === 'messaging' ? 'active' : ''}`} onClick={() => setActiveTab('messaging')}>✉️ Messaging Inbox</button>
          <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>📋 Selected Gigs Report</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Retrieving administrative records...</p>
        </div>
      ) : (
        <div className="admin-tab-content">
          {activeTab === 'overview' && stats && (
            <div className="stats-tab-view animate-fade">
              <div className="stats-grid">
                <div className="stats-card glass-card">
                  <span className="card-icon">💻</span>
                  <h3>Total Students</h3>
                  <p className="stats-value">{stats.totalStudents}</p>
                </div>
                <div className="stats-card glass-card">
                  <span className="card-icon">🏢</span>
                  <h3>Industry Partners</h3>
                  <p className="stats-value">{stats.totalPartners}</p>
                </div>
                <div className="stats-card glass-card">
                  <span className="card-icon">💼</span>
                  <h3>Gigs Posted</h3>
                  <p className="stats-value">{stats.approvedGigs} <span className="stats-value-sub">/ {stats.totalGigs} approved</span></p>
                </div>
              </div>

              <div className="economic-impact-card glass-card">
                <div className="impact-header">
                  <span className="card-icon-large">💰</span>
                  <div>
                    <h3>Economic Impact Sum</h3>
                    <p className="impact-subtitle">Cumulative budget value of all approved job gigs, internships, and scholarships shared within the university.</p>
                  </div>
                </div>
                <h2 className="economic-impact-value">{formatCurrency(stats.economicImpact)}</h2>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="table-view glass-card animate-fade">
              <h3>All Platform Users</h3>
              <p className="table-subtitle">Review registered university students and verify corporate partners.</p>
              
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email / Role</th>
                      <th>Identification</th>
                      <th>Status</th>
                      <th>Verification</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-cell">No registered members found.</td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>{u.fullName}</strong>
                            <div className="subtext">{u.phone}</div>
                          </td>
                          <td>
                            {u.email}
                            <div>
                              <span className={`role-badge ${u.role === 'ROLE_STUDENT' ? 'role-student' : 'role-poster'}`}>
                                {u.role === 'ROLE_STUDENT' ? 'Student' : 'Partner'}
                              </span>
                            </div>
                          </td>
                          <td>{u.studentId ? <code>{u.studentId}</code> : <span className="subtext">N/A</span>}</td>
                          <td>
                            <span className={`status-pill ${u.active ? 'status-active' : 'status-suspended'}`}>
                              {u.active ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${u.verified ? 'status-verified' : 'status-unverified'}`}>
                              {u.verified ? 'Verified ✓' : 'Unverified'}
                            </span>
                          </td>
                          <td>
                            <div className="action-cell">
                              <button onClick={() => handleVerifyToggle(u.id, u.verified)} className={`btn btn-sm ${u.verified ? 'btn-outline' : 'btn-primary'}`}>
                                {u.verified ? 'Unverify' : 'Verify'}
                              </button>
                              <button onClick={() => handleStatusToggle(u.id, u.active)} className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'}`}>
                                {u.active ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="table-view glass-card animate-fade">
              <h3>Opportunities Moderation Queue</h3>
              <p className="table-subtitle">Approve posts to publish them on student feeds, or reject listings.</p>
              
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Posted By</th>
                      <th>Budget</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-cell">No opportunity posts registered.</td>
                      </tr>
                    ) : (
                      jobs.map((j) => (
                        <tr key={j.id}>
                          <td>
                            <strong>{j.title}</strong>
                            <div className="subtext">{j.description?.substring(0, 75)}...</div>
                          </td>
                          <td>
                            {j.postedBy?.fullName}
                            <div className="subtext">{j.postedBy?.email}</div>
                          </td>
                          <td><span className="budget-tag">{j.priceRange}</span></td>
                          <td>
                            <span className={`role-badge ${j.type === 'JOB' ? 'role-student' : j.type === 'INTERNSHIP' ? 'role-poster' : 'status-pending'}`}>
                              {j.type === 'JOB' ? 'Job Gig' : j.type === 'INTERNSHIP' ? 'Internship' : 'Scholarship'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill status-${j.status?.toLowerCase()}`}>
                              {j.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-cell">
                              {j.status !== 'APPROVED' && (
                                <button onClick={() => handleJobModeration(j.id, 'APPROVED')} className="btn btn-sm btn-primary">Approve</button>
                              )}
                              {j.status !== 'REJECTED' && (
                                <button onClick={() => handleJobModeration(j.id, 'REJECTED')} className="btn btn-sm btn-danger">Reject</button>
                              )}
                              {j.status === 'APPROVED' && <span className="subtext text-center">Approved ✓</span>}
                              {j.status === 'REJECTED' && <span className="subtext text-center">Rejected ✗</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'mentor' && (
            <div className="job-form-wrapper glass-card animate-fade" style={{ textAlign: 'left' }}>
              <h3>Publish a New <span className="gradient-text">Opportunity or Mentor Slot</span></h3>
              <p className="form-helper-text">Add pre-approved listings directly to students in their corresponding tabs.</p>
              
              <div className="form-group" style={{ maxWidth: '300px', marginTop: '1rem' }}>
                <label className="form-label" htmlFor="publishType">Listing Category *</label>
                <select 
                  className="form-select" 
                  id="publishType" 
                  value={publishType} 
                  onChange={e => setPublishType(e.target.value)}
                >
                  <option value="MENTOR">Mentor Programme Slot</option>
                  <option value="INTERNSHIP">Internship Opportunity</option>
                  <option value="SCHOLARSHIP">Scholarship Opportunity</option>
                </select>
              </div>

              <form onSubmit={handlePublishOpportunity} className="new-job-form" style={{ marginTop: '1.5rem' }}>
                {publishType === 'MENTOR' ? (
                  <>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label" htmlFor="mTitle">Mentorship Title *</label>
                        <input className="form-input" type="text" id="mTitle" placeholder="e.g. Industry Java Development Coaching" value={mentorData.title} onChange={e => setMentorData({ ...mentorData, title: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="mMentor">Mentor Name *</label>
                        <input className="form-input" type="text" id="mMentor" placeholder="e.g. Prof. David Miller" value={mentorData.mentorName} onChange={e => setMentorData({ ...mentorData, mentorName: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="mSchool">Target School / Department / Faculty *</label>
                      <input className="form-input" type="text" id="mSchool" placeholder="e.g. Computing School / Engineering School" value={mentorData.school} onChange={e => setMentorData({ ...mentorData, school: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="mDesc">Description & Objectives *</label>
                      <textarea className="form-input form-textarea" id="mDesc" placeholder="Describe scope, meeting frequencies, requirements, and coaching targets..." value={mentorData.description} onChange={e => setMentorData({ ...mentorData, description: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label" htmlFor="jTitle">Opportunity Title *</label>
                        <input className="form-input" type="text" id="jTitle" placeholder={publishType === 'INTERNSHIP' ? "e.g. Graduate QA Engineer Intern" : "e.g. Undergraduate Research Grant"} value={jobData.title} onChange={e => setJobData({ ...jobData, title: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="jPrice">Compensation / Value / Budget *</label>
                        <input className="form-input" type="text" id="jPrice" placeholder="e.g. LKR 30,000 / month" value={jobData.priceRange} onChange={e => setJobData({ ...jobData, priceRange: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="jReqs">Skills / Qualifications Required *</label>
                      <input className="form-input" type="text" id="jReqs" placeholder="e.g. Java, Spring Boot, Git" value={jobData.requirements} onChange={e => setJobData({ ...jobData, requirements: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="jDesc">Detailed Description *</label>
                      <textarea className="form-input form-textarea" id="jDesc" placeholder="Submit full description of requirements, details, and application instructions..." value={jobData.description} onChange={e => setJobData({ ...jobData, description: e.target.value })} />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary publish-submit-btn">
                  Publish {publishType === 'MENTOR' ? 'Mentor Slot' : publishType === 'INTERNSHIP' ? 'Internship' : 'Scholarship'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="table-view glass-card animate-fade">
              <h3>Mentor Application Notifications Center</h3>
              <p className="table-subtitle">Review mentorship applications submitted by students for active programs.</p>
              
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Details</th>
                      <th>Reg Number</th>
                      <th>Mentor Program</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-cell">No student mentorship applications submitted yet.</td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <strong>{app.student?.fullName}</strong>
                            <div className="subtext">{app.student?.email}</div>
                          </td>
                          <td><code>{app.student?.username === app.student?.email ? 'STUDENT' : app.student?.username}</code></td>
                          <td>
                            <strong>{app.mentorProgram?.title}</strong>
                            <div className="subtext">Mentor: {app.mentorProgram?.mentorName} | School: {app.mentorProgram?.school}</div>
                          </td>
                          <td>{formatDate(app.appliedAt)}</td>
                          <td>
                            <span className={`status-pill status-${app.status?.toLowerCase()}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-cell">
                              {app.status === 'PENDING' ? (
                                <>
                                  <button onClick={() => handleModerateApplication(app.id, 'APPROVED')} className="btn btn-sm btn-primary">Approve</button>
                                  <button onClick={() => handleModerateApplication(app.id, 'REJECTED')} className="btn btn-sm btn-danger">Reject</button>
                                </>
                              ) : (
                                <span className="subtext">Moderate Done</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'messaging' && (
            <div className="job-form-wrapper glass-card animate-fade" style={{ textAlign: 'left' }}>
              <h3>Admin Message <span className="gradient-text font-normal">Dispatcher</span></h3>
              <p className="form-helper-text">Filter platform users by role, select the recipient, and dispatch direct notifications to their inboxes.</p>
              
              <form onSubmit={handleSendMessage} className="new-job-form" style={{ marginTop: '1.5rem' }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="roleFilter">Filter Recipient Role *</label>
                    <select 
                      className="form-select" 
                      id="roleFilter" 
                      value={roleFilter} 
                      onChange={e => {
                        setRoleFilter(e.target.value);
                        setSelectedRecipientId(''); // reset
                      }}
                    >
                      <option value="ROLE_STUDENT">Students</option>
                      <option value="ROLE_JOB_POSTER">Industry Partners</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="recipient">Select Target User *</label>
                    <select 
                      className="form-select" 
                      id="recipient" 
                      value={selectedRecipientId} 
                      onChange={e => setSelectedRecipientId(e.target.value)}
                    >
                      <option value="">-- Choose User --</option>
                      {filteredUsersForMessaging.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="msgContent">Message Content *</label>
                  <textarea 
                    className="form-input form-textarea" 
                    id="msgContent" 
                    placeholder="Type your official broadcast notification here..." 
                    value={messageText} 
                    onChange={e => setMessageText(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-secondary publish-submit-btn">Send Message Alert</button>
              </form>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="table-view glass-card animate-fade">
              <h3>Selected Candidates Match Report</h3>
              <p className="table-subtitle">Official summary of matches between university students and industry opportunity postings.</p>
              
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Opportunity Details</th>
                      <th>Corporate Partner</th>
                      <th>Selected Student</th>
                      <th>Academic Reg No</th>
                      <th>LinkedIn Profile</th>
                      <th>Selected Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-cell">No student matches have been selected yet.</td>
                      </tr>
                    ) : (
                      selectedReports.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.jobPost?.title}</strong>
                            <div style={{ marginTop: '0.2rem' }}>
                              <span className={`role-badge ${r.jobPost?.type === 'JOB' ? 'role-student' : r.jobPost?.type === 'INTERNSHIP' ? 'role-poster' : 'status-pending'}`}>
                                {r.jobPost?.type === 'JOB' ? 'Job Gig' : r.jobPost?.type === 'INTERNSHIP' ? 'Internship' : 'Scholarship'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <strong>{r.jobPost?.postedBy?.fullName}</strong>
                            <div className="subtext">{r.jobPost?.postedBy?.email}</div>
                          </td>
                          <td>
                            <strong>{r.student?.fullName}</strong>
                            <div className="subtext">{r.student?.email}</div>
                          </td>
                          <td><code>{r.student?.studentId || r.student?.username}</code></td>
                          <td>
                            <a href={r.linkedinUrl} target="_blank" rel="noopener noreferrer" className="gradient-text" style={{ fontWeight: 600 }}>
                              View LinkedIn ↗
                            </a>
                          </td>
                          <td>{formatDate(r.appliedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
