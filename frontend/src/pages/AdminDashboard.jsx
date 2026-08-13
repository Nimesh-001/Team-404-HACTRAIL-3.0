import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, jobs, mentor, applications, messaging, report
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [allSelectedReports, setAllSelectedReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  
  // Report filters state
  const [reportYear, setReportYear] = useState('ALL');
  const [reportMonth, setReportMonth] = useState('ALL');

  // Bank Details configuration state
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    branchName: '',
    accountHolderName: ''
  });

  // Modal slip popup state
  const [viewSlipImage, setViewSlipImage] = useState(null);

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
    websiteLink: '',
    bankSlip: '',
  });
  
  // Messaging form
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ROLE_STUDENT');

  // Users tab search + pagination state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const [viewDeleted, setViewDeleted] = useState(false);
  const USERS_PER_PAGE = 10;

  // Completed & Cash Payment verification states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentJob, setPaymentJob] = useState(null);
  const [paymentTime, setPaymentTime] = useState('');
  const [paymentVenue, setPaymentVenue] = useState('');
  
  const [signedSlipsMap, setSignedSlipsMap] = useState({}); // jobId -> Base64
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printJob, setPrintJob] = useState(null);
  const [printCandidates, setPrintCandidates] = useState([]);
  const [printLoading, setPrintLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  useEffect(() => {
    fetchInbox();
    fetchAllJobsForFinance();
    fetchAllSelectedReportsForFinance();
  }, []);

  const fetchAllJobsForFinance = async () => {
    try {
      const res = await API.get('/api/admin/jobs');
      setAllJobs(res.data || []);
    } catch (err) {
      console.error('Failed to load all jobs for finance', err);
    }
  };

  const fetchAllSelectedReportsForFinance = async () => {
    try {
      const res = await API.get('/api/admin/selected-report');
      setAllSelectedReports(res.data || []);
    } catch (err) {
      console.error('Failed to load all selected reports for finance', err);
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

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'overview') {
        const res = await API.get('/api/admin/stats');
        setStats(res.data);
        const bankRes = await API.get('/api/jobs/bank-details');
        setBankDetails(bankRes.data);
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
      // Always refresh the shared financial data after any tab-level fetch
      // so Stats and Report tabs reflect the latest jobs without a page reload
      fetchAllJobsForFinance();
      fetchAllSelectedReportsForFinance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve admin records.');
    } finally {
      setLoading(false);
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

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      const res = await API.put('/api/admin/bank-details', bankDetails);
      setSuccess('University bank details updated successfully!');
      setBankDetails(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bank details.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This is a soft-delete.')) return;
    setSuccess('');
    setError('');
    try {
      const res = await API.put(`/api/admin/users/${userId}/delete`);
      setSuccess(res.data.message || 'User deleted successfully!');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted: true, active: false } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleRestoreUser = async (userId) => {
    setSuccess('');
    setError('');
    try {
      const res = await API.put(`/api/admin/users/${userId}/restore`);
      setSuccess(res.data.message || 'User restored successfully!');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted: false, active: true } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore user.');
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

  const handleOpenPaymentModal = (job) => {
    setPaymentJob(job);
    setPaymentTime('');
    setPaymentVenue('');
    setShowPaymentModal(true);
  };

  const handleSendPaymentNotification = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!paymentTime.trim() || !paymentVenue.trim()) {
      setError('Time and Venue fields are mandatory.');
      return;
    }

    try {
      await API.post(`/api/admin/jobs/${paymentJob.id}/notify-payment`, {
        time: paymentTime,
        venue: paymentVenue
      });
      setSuccess('Inbox cash collection alerts dispatched successfully to all selected candidates!');
      setShowPaymentModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch payment alerts.');
    }
  };

  const handleGenerateReceiptSheet = async (job) => {
    setError('');
    setPrintJob(job);
    setPrintLoading(true);
    setShowPrintModal(true);
    try {
      const res = await API.get(`/api/jobs/${job.id}/applications`);
      const selectedOnly = res.data.filter(app => app.status === 'SELECTED');
      setPrintCandidates(selectedOnly);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve selections for payment sheet.');
    } finally {
      setPrintLoading(false);
    }
  };

  const handleUploadSignedSlip = (e, jobId) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignedSlipsMap(prev => ({ ...prev, [jobId]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCloseProject = async (jobId) => {
    setError('');
    setSuccess('');
    const slip = signedSlipsMap[jobId];
    if (!slip) {
      setError('Please select and upload the physical signed payment receipt sheet image first.');
      return;
    }
    try {
      await API.put(`/api/admin/jobs/${jobId}/close`, {
        signedReportSlip: slip
      });
      setSuccess('Project closed and finalized successfully! Student balances updated.');
      fetchInitialData(); // reload queue
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close project.');
    }
  };

  const handleAdminFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setJobData(prev => ({ ...prev, bankSlip: reader.result }));
    };
    reader.readAsDataURL(file);
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
      if (!jobData.title || !jobData.description || !jobData.websiteLink || !jobData.bankSlip) {
        setError('Title, Description, Website Link, and Banner Image are required.');
        return;
      }
      try {
        const res = await API.post('/api/admin/jobs', {
          title: jobData.title,
          description: jobData.description,
          requirements: 'N/A',
          priceRange: 'N/A',
          websiteLink: jobData.websiteLink,
          bankSlip: jobData.bankSlip,
          type: publishType
        });
        setSuccess(res.data.message || `${publishType} opportunity published successfully!`);
        setJobData({ title: '', description: '', requirements: '', priceRange: '', websiteLink: '', bankSlip: '' });
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

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    // Strip commas first, then extract the FIRST numeric sequence only
    // This correctly handles "LKR 10,000 (per member)", "LKR 15,000 - 25,000", etc.
    const stripped = priceStr.replace(/,/g, '');
    const match = stripped.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const filteredUsersForMessaging = users.filter(u => u.role === roleFilter);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  // Economic Impact: deduplicate by job ID, sum (perMember × vacancies) for APPROVED+COMPLETED+CLOSED JOB posts
  // This is identical to totalDeposited in the Report tab (no year/month filter applied here — always totals)
  const economicImpactFrontend = (() => {
    const seen = {};
    allJobs.forEach(job => {
      if (!job.id) return;
      if (['APPROVED', 'COMPLETED', 'CLOSED'].includes(job.status) && job.type === 'JOB') {
        if (!seen[job.id]) seen[job.id] = job;
      }
    });
    return Object.values(seen).reduce((sum, job) => {
      return sum + parsePrice(job.priceRange) * (job.vacancies || 1);
    }, 0);
  })();

  // All-time Paid to Students: sum of per-member payout for every SELECTED application in CLOSED jobs
  const allTimePaidToStudents = allSelectedReports.reduce((sum, r) => {
    if (r.jobPost?.status === 'CLOSED') {
      return sum + parsePrice(r.jobPost?.priceRange);
    }
    return sum;
  }, 0);

  // Report calculations based on filter dropdowns
  const displayedReports = selectedReports.filter(r => {
    if (!r.appliedAt) return false;
    const date = new Date(r.appliedAt);
    const y = date.getFullYear().toString();
    const m = date.getMonth().toString();
    const yearMatch = reportYear === 'ALL' || y === reportYear;
    const monthMatch = reportMonth === 'ALL' || m === reportMonth;
    return yearMatch && monthMatch;
  });

  // totalDeposited: uses allJobs (SAME source as Stats tab) filtered by year/month
  // This guarantees Stats tab and Report tab always show identical Incoming Sponsor Deposits
  const depositedByJob = {};
  allJobs.forEach(job => {
    if (!job.id || job.type !== 'JOB') return;
    if (!['APPROVED', 'COMPLETED', 'CLOSED'].includes(job.status)) return;
    // Apply year/month filter based on job creation date
    if (reportYear !== 'ALL' || reportMonth !== 'ALL') {
      if (!job.createdAt) return;
      const d = new Date(job.createdAt);
      if (reportYear !== 'ALL' && d.getFullYear().toString() !== reportYear) return;
      if (reportMonth !== 'ALL' && d.getMonth().toString() !== reportMonth) return;
    }
    if (!depositedByJob[job.id]) depositedByJob[job.id] = job;
  });
  const totalDeposited = Object.values(depositedByJob).reduce((sum, job) => {
    return sum + parsePrice(job.priceRange) * (job.vacancies || 1);
  }, 0);

  // totalPaidToStudents: per-member payout for every SELECTED applicant in CLOSED jobs (from selectedReports)
  const totalPaidToStudents = displayedReports.reduce((sum, r) => {
    if (r.jobPost?.status === 'CLOSED') {
      return sum + parsePrice(r.jobPost?.priceRange);
    }
    return sum;
  }, 0);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="admin-title">System <span className="gradient-text">Administration</span></h2>
          <p className="admin-subtitle">Monitor university users, verify profiles, moderate postings, and publish direct opportunities.</p>
        </div>

        {/* Admin Notification Bell Icon */}
        <div className="notification-bell-container no-print" style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowBellDropdown(!showBellDropdown)} 
            className="btn btn-outline" 
            style={{ padding: '0.75rem 1rem', fontSize: '1.25rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            🔔 {unreadCount > 0 && <span className="bell-badge-count">{unreadCount}</span>}
          </button>
          
          {showBellDropdown && (
            <div className="bell-dropdown-list glass-card" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem', width: '320px', zIndex: 999, padding: '1rem', textAlign: 'left' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Admin Notifications</h4>
              {messages.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No admin notifications yet.</p>
              ) : (
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.map(m => (
                    <div key={m.id} className={`bell-message-item ${m.read ? 'read' : 'unread'}`} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: m.read ? '#fff' : '#fcfcfc', borderLeft: m.read ? '1px solid var(--border-color)' : '4px solid var(--primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>User Message</span>
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
      </div>
      
      <div className="admin-tab-nav-wrapper no-print">
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

      {success && <div className="alert alert-success no-print">{success}</div>}
      {error && <div className="alert alert-danger no-print">{error}</div>}

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

              {/* 3 Financial Summary Cards — same data as Gigs Report tab but all-time (no filter) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stats-card glass-card" style={{ background: 'rgba(5, 150, 105, 0.04)', border: '1px solid var(--border-color)', textAlign: 'left', padding: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Incoming Sponsor Deposits</h4>
                  <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', color: 'var(--success)' }}>{formatCurrency(economicImpactFrontend)}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total funds received in system account (all time).</p>
                </div>
                <div className="stats-card glass-card" style={{ background: 'rgba(59, 130, 246, 0.04)', border: '1px solid var(--border-color)', textAlign: 'left', padding: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paid to Students</h4>
                  <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', color: 'var(--primary)' }}>{formatCurrency(allTimePaidToStudents)}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total student acquittances sign-offs archived (all time).</p>
                </div>
                <div className="stats-card glass-card" style={{ background: 'rgba(254, 218, 106, 0.04)', border: '1px solid var(--border-color)', textAlign: 'left', padding: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Treasury Escrow Balance</h4>
                  <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', color: 'var(--secondary)' }}>{formatCurrency(economicImpactFrontend - allTimePaidToStudents)}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending disbursements for active matches (all time).</p>
                </div>
              </div>

              {/* University Bank Details Form */}
              <div className="economic-impact-card glass-card" style={{ textAlign: 'left' }}>
                <div className="impact-header" style={{ marginBottom: '1rem' }}>
                  <span className="card-icon-large">🏛️</span>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Configure University Deposit Account</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Manage the bank account details displayed to partners when they submit bank slips for listing moderations.
                    </p>
                  </div>
                </div>
                
                <form onSubmit={handleUpdateBankDetails} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Bank Name *</label>
                    <input className="form-input" type="text" value={bankDetails.bankName || ''} onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Account Number *</label>
                    <input className="form-input" type="text" value={bankDetails.accountNumber || ''} onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Branch Name *</label>
                    <input className="form-input" type="text" value={bankDetails.branchName || ''} onChange={e => setBankDetails({ ...bankDetails, branchName: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Account Holder *</label>
                    <input className="form-input" type="text" value={bankDetails.accountHolderName || ''} onChange={e => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })} required />
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0.65rem 1.5rem' }}>
                      Update Bank Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="table-view glass-card animate-fade">
              <h3>All Platform Users</h3>
              <p className="table-subtitle">Review registered university students and verify corporate partners.</p>

              {/* Search + Role Filter Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Search by name or TG number..."
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                  style={{ flex: '1 1 220px', minWidth: '180px', maxWidth: '340px' }}
                />
                <select
                  className="form-select"
                  value={userRoleFilter}
                  onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                  style={{ flex: '0 0 auto', minWidth: '160px' }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="ROLE_STUDENT">Students</option>
                  <option value="ROLE_JOB_POSTER">Industry Partners</option>
                </select>
                {(userSearch || userRoleFilter !== 'ALL') && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => { setUserSearch(''); setUserRoleFilter('ALL'); setUserPage(1); }}
                  >Clear</button>
                )}

                {/* Deleted History Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={viewDeleted}
                    onChange={e => { setViewDeleted(e.target.checked); setUserPage(1); }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Show Deleted History</span>
                </label>
              </div>

              {/* Derived filtered + paginated list */}
              {(() => {
                const filtered = users.filter(u => {
                  const roleMatch = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                  const term = userSearch.trim().toLowerCase();
                  const nameMatch = !term ||
                    (u.fullName || '').toLowerCase().includes(term) ||
                    (u.studentId || '').toLowerCase().includes(term);
                  const deletedMatch = viewDeleted ? u.deleted === true : !u.deleted;
                  return roleMatch && nameMatch && deletedMatch;
                });
                const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PER_PAGE));
                const safePage = Math.min(userPage, totalPages);
                const pageUsers = filtered.slice((safePage - 1) * USERS_PER_PAGE, safePage * USERS_PER_PAGE);

                return (
                  <>
                    <div className="table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Full Name</th>
                            <th>Email / Role</th>
                            <th>Identification</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageUsers.length === 0 ? (
                            <tr><td colSpan="5" className="empty-cell">No users match your search.</td></tr>
                          ) : (
                            pageUsers.map((u) => (
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
                                  {u.deleted ? (
                                    <span className="status-pill status-suspended" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                      Deleted
                                    </span>
                                  ) : (
                                    <span className={`status-pill ${u.active ? 'status-active' : 'status-suspended'}`}>
                                      {u.active ? 'Active' : 'Suspended'}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div className="action-cell">
                                    {u.deleted ? (
                                      <button onClick={() => handleRestoreUser(u.id)} className="btn btn-sm btn-success">
                                        Restore
                                      </button>
                                    ) : (
                                      <button onClick={() => handleDeleteUser(u.id)} className="btn btn-sm btn-danger">
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {filtered.length > USERS_PER_PAGE && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>Showing {(safePage - 1) * USERS_PER_PAGE + 1}–{Math.min(safePage * USERS_PER_PAGE, filtered.length)} of {filtered.length} users</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            disabled={safePage <= 1}
                            onClick={() => setUserPage(p => p - 1)}
                          >← Previous</button>
                          <button
                            className="btn btn-outline btn-sm"
                            disabled={safePage >= totalPages}
                            onClick={() => setUserPage(p => p + 1)}
                          >Next →</button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
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
                      <th>Slip / Receipt</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-cell">No opportunity posts registered.</td>
                      </tr>
                    ) : (
                      jobs.map((j) => (
                        <tr key={j.id}>
                          <td>
                            <strong>{j.title}</strong>
                            <div className="subtext">{j.description?.substring(0, 75)}...</div>
                            <div style={{ marginTop: '0.25rem' }}>
                              <span className={`role-badge ${j.type === 'JOB' ? 'role-student' : j.type === 'INTERNSHIP' ? 'role-poster' : 'status-pending'}`}>
                                {j.type === 'JOB' ? 'Job Gig' : j.type === 'INTERNSHIP' ? 'Internship' : 'Scholarship'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {j.postedBy?.fullName}
                            <div className="subtext">{j.postedBy?.email}</div>
                          </td>
                          <td><span className="budget-tag">{j.priceRange}</span></td>
                          <td>
                            {/* Slips column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {j.bankSlip && (
                                <button onClick={() => setViewSlipImage(j.bankSlip)} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}>
                                  View Slip/Image 👁️
                                </button>
                              )}
                              {j.signedReportSlip && (
                                <button onClick={() => setViewSlipImage(j.signedReportSlip)} className="btn btn-sm btn-success" style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: 'none' }}>
                                  View Signed Receipt 📄
                                </button>
                              )}
                              {!j.bankSlip && !j.signedReportSlip && (
                                <span className="subtext" style={{ color: 'var(--error)' }}>No attachments</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill status-${j.status?.toLowerCase()}`}>
                              {j.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-cell" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {j.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                  <button onClick={() => handleJobModeration(j.id, 'APPROVED')} className="btn btn-sm btn-primary">Approve</button>
                                  <button onClick={() => handleJobModeration(j.id, 'REJECTED')} className="btn btn-sm btn-danger">Reject</button>
                                </div>
                              )}
                              {j.status === 'REJECTED' && <span className="subtext">Rejected ✗</span>}
                              
                              {/* Completed flows */}
                              {j.status === 'COMPLETED' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', minWidth: '150px' }}>
                                  <button onClick={() => handleOpenPaymentModal(j)} className="btn btn-sm btn-secondary" style={{ width: '100%' }}>
                                    📅 Notify Cash Collection
                                  </button>
                                  <button onClick={() => handleGenerateReceiptSheet(j)} className="btn btn-sm btn-outline" style={{ width: '100%' }}>
                                    🖨️ Print Payout Sheet
                                  </button>
                                  
                                  {/* Signed Report slip upload */}
                                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.4rem', background: 'var(--bg-dark)' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Signed Receipt Image:</label>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={(e) => handleUploadSignedSlip(e, j.id)} 
                                      style={{ fontSize: '0.7rem', width: '100%' }}
                                    />
                                    {signedSlipsMap[j.id] && (
                                      <button 
                                        onClick={() => handleCloseProject(j.id)} 
                                        className="btn btn-sm btn-success" 
                                        style={{ marginTop: '0.4rem', width: '100%', border: 'none', padding: '0.3rem' }}
                                      >
                                        🔒 Close Project completely
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {j.status === 'CLOSED' && (
                                <span className="subtext" style={{ color: 'var(--success)', fontWeight: 600 }}>Closed & Finalized ✓</span>
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

          {activeTab === 'mentor' && (
            <div className="job-form-wrapper glass-card" style={{ textAlign: 'left' }}>
              <h3>Publish a New <span className="gradient-text">Opportunity or Mentor Slot</span></h3>
              <p className="form-helper-text">Add approved listings directly to students in their corresponding tabs.</p>
              
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
                    <div className="form-group">
                      <label className="form-label" htmlFor="jTitle">Opportunity Title *</label>
                      <input className="form-input" type="text" id="jTitle" placeholder={publishType === 'INTERNSHIP' ? "e.g. Summer Research Intern" : "e.g. Dean Merit List Grant"} value={jobData.title} onChange={e => setJobData({ ...jobData, title: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="jLink">Website Application Link *</label>
                      <input className="form-input" type="url" id="jLink" placeholder="https://university.edu/apply" value={jobData.websiteLink} onChange={e => setJobData({ ...jobData, websiteLink: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="jSlip">Upload Banner Image / Post *</label>
                      <input className="form-input" type="file" id="jSlip" accept="image/*" onChange={handleAdminFileChange} />
                      {jobData.bankSlip && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <span className="subtext">Preview Banner:</span>
                          <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.25rem', maxWidth: '200px' }}>
                            <img src={jobData.bankSlip} alt="Banner Preview" style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="jDesc">Simple Description *</label>
                      <textarea className="form-input form-textarea" id="jDesc" placeholder="Briefly describe the opportunity scope and qualifications..." value={jobData.description} onChange={e => setJobData({ ...jobData, description: e.target.value })} />
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
            <div className="table-view glass-card animate-fade printable-report-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="no-print">
                <div>
                  <h3 style={{ margin: 0 }}>Selected Candidates Match Report</h3>
                  <p className="table-subtitle" style={{ margin: 0 }}>Official summary of matches between university students and industry opportunity postings.</p>
                </div>
                
                <button className="btn btn-primary" onClick={() => window.print()}>
                  🖨️ Print Financial Report
                </button>
              </div>

              {/* Annual and Monthly filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }} className="no-print">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Year Filter</label>
                  <select className="form-select" value={reportYear} onChange={e => setReportYear(e.target.value)}>
                    <option value="ALL">All Years</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Month Filter</label>
                  <select className="form-select" value={reportMonth} onChange={e => setReportMonth(e.target.value)}>
                    <option value="ALL">All Months</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
              </div>

              {/* Printed Report Header Panel (Only visible during print) */}
              <div style={{ display: 'none', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem', textAlign: 'center' }} className="only-print">
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#000' }}>SKILLBRIDGE ANNUAL & MONTHLY AUDIT REPORT</h2>
                <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.25rem 0 0 0' }}>University Acquittances and Sponsor Deposits Summary</p>
                <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                  Filter: <strong>{reportYear === 'ALL' ? 'All Years' : reportYear}</strong> / <strong>{reportMonth === 'ALL' ? 'All Months' : ['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(reportMonth)]}</strong>
                </div>
              </div>

              {/* Economic Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }} className="report-summary-cards">
                <div className="stats-card glass-card" style={{ background: 'rgba(5, 150, 105, 0.04)', border: '1px solid var(--border-color)', textAlign: 'left', padding: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Incoming Sponsor Deposits</h4>
                  <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', color: 'var(--success)' }}>{formatCurrency(totalDeposited)}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total funds received in system account.</p>
                </div>
                <div className="stats-card glass-card" style={{ background: 'rgba(59, 130, 246, 0.04)', border: '1px solid var(--border-color)', textAlign: 'left', padding: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paid to Students</h4>
                  <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', color: 'var(--primary)' }}>{formatCurrency(totalPaidToStudents)}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total student acquittances sign-offs archived.</p>
                </div>
                <div className="stats-card glass-card" style={{ background: 'rgba(254, 218, 106, 0.04)', border: '1px solid var(--border-color)', textAlign: 'left', padding: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Treasury Escrow Balance</h4>
                  <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', color: 'var(--secondary)' }}>{formatCurrency(totalDeposited - totalPaidToStudents)}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending disbursements for active matches.</p>
                </div>
              </div>

              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Matched Opportunity</th>
                      <th>Industry Sponsor</th>
                      <th>Selected Student</th>
                      <th>Reg No / Phone</th>
                      <th>Status</th>
                      <th>Funds Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-cell">No matching reports found for the selected time filter.</td>
                      </tr>
                    ) : (
                      displayedReports.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.jobPost?.title}</strong>
                            <div className="subtext">{formatDate(r.appliedAt)}</div>
                          </td>
                          <td>
                            <strong>{r.jobPost?.postedBy?.fullName}</strong>
                            <div className="subtext">{r.jobPost?.postedBy?.email}</div>
                          </td>
                          <td>
                            <strong>{r.student?.fullName}</strong>
                            <div className="subtext">{r.student?.email}</div>
                          </td>
                          <td>
                            <code>{r.student?.studentId || r.student?.username}</code>
                            <div className="subtext">{r.student?.phone || 'N/A'}</div>
                          </td>
                          <td>
                            <span className={`status-pill ${r.jobPost?.status === 'CLOSED' ? 'status-verified' : 'status-unverified'}`}>
                              {r.jobPost?.status === 'CLOSED' ? 'Paid ✓' : 'In Escrow'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              <span style={{ color: 'var(--success)' }}>+{r.jobPost?.priceRange}</span> (In)
                            </div>
                            {r.jobPost?.status === 'CLOSED' && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                -{r.jobPost?.priceRange} (Out)
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Print Acquittance Footer Signatures */}
              <div style={{ display: 'none', marginTop: '3.5rem', justifyContent: 'space-between', fontSize: '0.85rem' }} className="only-print print-signatures">
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '35px' }}></div>
                  <span style={{ color: '#000' }}>Prepared By (Treasury Officer)</span>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '35px' }}></div>
                  <span style={{ color: '#000' }}>Approved By (Dean / Vice Chancellor)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slip Image View Modal Overlay */}
      {viewSlipImage && (
        <div className="modal-overlay" onClick={() => setViewSlipImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3 className="modal-title">Verification Image Attachment</h3>
              <button className="close-modal-btn" onClick={() => setViewSlipImage(null)}>×</button>
            </div>
            <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-dark)', display: 'flex', justifyContent: 'center' }}>
              <img src={viewSlipImage} alt="Verification Attachment" style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '4px', objectFit: 'contain' }} />
            </div>
            <div className="modal-footer" style={{ marginTop: '1rem', paddingTop: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setViewSlipImage(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment scheduler modal overlay */}
      {showPaymentModal && paymentJob && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule Payment Cash Collection</h3>
              <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <form onSubmit={handleSendPaymentNotification}>
              <p className="subtext" style={{ marginBottom: '1rem' }}>
                Broadcast cash pickup alerts to all selected candidates for <strong>{paymentJob.title}</strong>.
              </p>
              
              <div className="form-group">
                <label className="form-label">Pickup Time & Date *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="e.g. Monday, Aug 17th from 10:00 AM" 
                  value={paymentTime}
                  onChange={e => setPaymentTime(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Collection Venue / Location *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="e.g. Faculty of Technology Boardroom" 
                  value={paymentVenue}
                  onChange={e => setPaymentVenue(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch Collection Alerts</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable payment receipt sheets overlay */}
      {showPrintModal && printJob && (
        <div className="modal-overlay">
          <div className="modal-content printable-report-area" style={{ maxWidth: '650px', background: '#fff', color: '#000', padding: '2.5rem' }}>
            <div className="modal-header no-print" style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Payment Signature Receipt Sheet</h3>
              <button className="close-modal-btn" onClick={() => setShowPrintModal(false)} style={{ color: '#888' }}>×</button>
            </div>

            {printLoading ? (
              <p>Retrieving selections...</p>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>SKILLBRIDGE PAYOUT SHEET</h2>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.25rem 0 0 0' }}>University Payout Verification and Acquittance Sheet</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem', background: '#f8f9fa', padding: '1rem', borderRadius: '6px', border: '1px solid #ddd' }} className="receipt-meta-box">
                  <div>Project Title: <strong>{printJob.title}</strong></div>
                  <div>Compensation: <strong>{printJob.priceRange}</strong></div>
                  <div>Corporate Sponsor: <strong>{printJob.postedBy?.fullName}</strong></div>
                  <div>Date Generated: <strong>{new Date().toLocaleDateString()}</strong></div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '2rem' }} className="receipt-table-sheet">
                  <thead>
                    <tr style={{ background: '#f1f1f1', borderBottom: '2px solid #000' }}>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left' }}>Student Name</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left' }}>Registration ID (TG)</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left' }}>Contact Phone</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left' }}>Payout Amount</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center', width: '160px' }}>Signature Sign-off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printCandidates.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>No selected candidates found.</td>
                      </tr>
                    ) : (
                      printCandidates.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}><strong>{c.student?.fullName}</strong></td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}><code>{c.student?.studentId || c.student?.username}</code></td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{c.student?.phone || 'N/A'}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}><strong>{printJob.priceRange}</strong></td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd', height: '40px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px dotted #000', width: '100%', height: '20px' }}></div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }} className="receipt-sign-box">
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '30px' }}></div>
                    <span>Dean / Assistant Registrar (Sign & Date)</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '30px' }}></div>
                    <span>University Auditor Stamp</span>
                  </div>
                </div>

                <div className="modal-footer no-print" style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPrintModal(false)}>Close</button>
                  <button type="button" className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Acquittance Sheet</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
