import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const JobPosterDashboard = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Applicants view states
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicantsMap, setApplicantsMap] = useState({});
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [showSelectedOnlyMap, setShowSelectedOnlyMap] = useState({});

  // Complete Opportunity Rating Modal states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingJob, setCompletingJob] = useState(null);
  const [ratingsData, setRatingsData] = useState({}); // applicationId -> rating (1-5)

  // Slip Image View Modal Overlay
  const [viewSlipImage, setViewSlipImage] = useState(null);

  // Bell dropdown trigger state
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [adminMsgText, setAdminMsgText] = useState('');

  // New job form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    priceRange: '',
    totalBudget: '', // raw numeric total budget entered by recruiter
    type: 'JOB', // JOB, INTERNSHIP, SCHOLARSHIP
    vacancies: 1,
    maxApplications: 100,
    bankSlip: '', // Base64 data URL
    websiteLink: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchMyJobs();
    fetchInbox();
    fetchBankDetails();
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

  const fetchBankDetails = async () => {
    try {
      const res = await API.get('/api/jobs/bank-details');
      setBankDetails(res.data);
    } catch (err) {
      console.error("Failed to load university bank details", err);
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

  const handleOpenCompleteModal = async (job) => {
    setError('');
    setFormSuccess('');
    let selectedApps = [];
    
    // Make sure we have candidates loaded
    setApplicantsLoading(true);
    try {
      const res = await API.get(`/api/jobs/${job.id}/applications`);
      setApplicantsMap(prev => ({ ...prev, [job.id]: res.data }));
      selectedApps = res.data.filter(app => app.status === 'SELECTED');
    } catch (err) {
      console.error("Failed to retrieve candidate lists", err);
    } finally {
      setApplicantsLoading(false);
    }

    if (selectedApps.length === 0) {
      setError('You must select at least one candidate before marking this opportunity as Completed.');
      return;
    }

    const initialRatings = {};
    selectedApps.forEach(app => {
      initialRatings[app.id] = 5; // default 5 stars
    });

    setRatingsData(initialRatings);
    setCompletingJob(job);
    setShowCompleteModal(true);
  };

  const handleRatingChange = (appId, rating) => {
    setRatingsData(prev => ({ ...prev, [appId]: parseInt(rating) }));
  };

  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormSuccess('');
    try {
      const payload = {
        ratings: Object.keys(ratingsData).map(appId => ({
          applicationId: parseInt(appId),
          rating: ratingsData[appId]
        }))
      };
      await API.post(`/api/jobs/${completingJob.id}/complete`, payload);
      setFormSuccess('Opportunity marked as Completed successfully! Ratings submitted.');
      setShowCompleteModal(false);
      fetchMyJobs(); // refresh list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete opportunity.');
    }
  };

  const handleSendMessageToAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setFormSuccess('');
    if (!adminMsgText.trim()) return;
    try {
      await API.post('/api/messages/to-admin', { messageContent: adminMsgText });
      setFormSuccess('Your message has been sent successfully to the platform administrator!');
      setAdminMsgText('');
      setShowBellDropdown(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to send message to admin.');
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.title.trim()) tempErrors.title = 'Title is required';
    if (!formData.description.trim()) tempErrors.description = 'Description is required';

    if (formData.type === 'JOB') {
      if (!formData.requirements.trim()) tempErrors.requirements = 'Requirements are required';
      if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) tempErrors.priceRange = 'Total budget is required and must be greater than 0';
      if (formData.vacancies <= 0) tempErrors.vacancies = 'Vacancies must be greater than 0';
      if (formData.maxApplications <= 0) tempErrors.maxApplications = 'Applications count limit must be greater than 0';
      if (!formData.bankSlip) tempErrors.bankSlip = 'Bank deposit slip image upload is mandatory';
    } else {
      if (!formData.bankSlip) tempErrors.bankSlip = 'Banner image upload is mandatory';
      if (!formData.websiteLink.trim()) tempErrors.websiteLink = 'Website application link is required';
    }

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (formErrors.bankSlip) {
      setFormErrors(prev => ({ ...prev, bankSlip: '' }));
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, bankSlip: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    if (!validateForm()) return;

    setFormLoading(true);
    
    // Set default fields for non-job listings to avoid backend validation glitches
    const payload = { ...formData };
    if (payload.type !== 'JOB') {
      payload.requirements = 'N/A';
      payload.priceRange = 'N/A';
      payload.vacancies = 1;
      payload.maxApplications = 100;
    } else {
      // For JOB type: store per-member payout as the priceRange
      const budget = parseFloat(payload.totalBudget) || 0;
      const vac = parseInt(payload.vacancies) || 1;
      const perMember = vac > 0 ? Math.round(budget / vac) : budget;
      payload.priceRange = `LKR ${perMember.toLocaleString()} (per member)`;
    }

    try {
      const response = await API.post('/api/jobs', payload);
      setFormSuccess('Opportunity published successfully!');
      setFormData({
        title: '',
        description: '',
        requirements: '',
        priceRange: '',
        totalBudget: '',
        type: 'JOB',
        vacancies: 1,
        maxApplications: 100,
        bankSlip: '',
        websiteLink: '',
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
      {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="dashboard-header-wrapper">
        <div>
          <h1 className="dashboard-title">Manage <span className="gradient-text">Gigs & Offers</span></h1>
          <p className="dashboard-subtitle">Create, monitor, and manage your published projects and offers</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
          <p className="form-helper-text">Submit details and category. Jobs will display after admin verification; Internships and Scholarships publish immediately.</p>
          
          {/* University Bank Details Info Box (Only show when category is JOB) */}
          {bankDetails && formData.type === 'JOB' && (
            <div className="alert alert-success" style={{ marginBottom: '1.5rem', textAlign: 'left', background: 'rgba(254, 218, 106, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '0.95rem' }}>🏛️ University Bank Deposit Account Details</h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Please make the deposit listing fee to the university account below and upload your payment bank slip image as verification.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>Bank: <strong>{bankDetails.bankName}</strong></div>
                <div>Account No: <strong>{bankDetails.accountNumber}</strong></div>
                <div>Branch: <strong>{bankDetails.branchName}</strong></div>
                <div>Account Holder: <strong>{bankDetails.accountHolderName}</strong></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="new-job-form">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="title">Opportunity Title *</label>
                <input
                  className={`form-input ${formErrors.title ? 'input-error' : ''}`}
                  type="text"
                  id="title"
                  name="title"
                  placeholder={formData.type === 'JOB' ? "e.g. Develop a React portfolio website" : "e.g. Summer Software Engineer Internship"}
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

            {formData.type === 'JOB' ? (
              <>
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
                    <label className="form-label" htmlFor="totalBudget">Total Budget (LKR) *</label>
                    <input
                      className={`form-input ${formErrors.priceRange ? 'input-error' : ''}`}
                      type="number"
                      min="1"
                      id="totalBudget"
                      name="totalBudget"
                      placeholder="e.g. 50000"
                      value={formData.totalBudget}
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

                {/* Auto-calculated Per Member Payout */}
                {formData.totalBudget && parseInt(formData.vacancies) > 0 && (() => {
                  const perMember = Math.round(parseFloat(formData.totalBudget) / parseInt(formData.vacancies));
                  return (
                    <div style={{ background: 'rgba(254, 218, 106, 0.06)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Each Member Individual Payout</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800 }} className="gradient-text">
                          LKR {perMember.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div>Total Budget: <strong>LKR {parseFloat(formData.totalBudget).toLocaleString()}</strong></div>
                        <div>÷ {formData.vacancies} member{formData.vacancies > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="form-group">
                  <label className="form-label" htmlFor="bankSlip">Upload Bank Deposit Slip (Image) *</label>
                  <input
                    className={`form-input ${formErrors.bankSlip ? 'input-error' : ''}`}
                    type="file"
                    id="bankSlip"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {formErrors.bankSlip && <span className="validation-error">⚠️ {formErrors.bankSlip}</span>}
                  {formData.bankSlip && (
                    <div style={{ marginTop: '0.75rem', textAlign: 'left' }}>
                      <span className="subtext">Preview Uploaded Slip:</span>
                      <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.25rem', maxWidth: '120px' }}>
                        <img src={formData.bankSlip} alt="Deposit Slip Preview" style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="description">Simple Description *</label>
                  <textarea
                    className={`form-input form-textarea ${formErrors.description ? 'input-error' : ''}`}
                    id="description"
                    name="description"
                    placeholder="Briefly describe the program scope and application terms..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {formErrors.description && <span className="validation-error">⚠️ {formErrors.description}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="websiteLink">Website Application Link *</label>
                  <input
                    className={`form-input ${formErrors.websiteLink ? 'input-error' : ''}`}
                    type="url"
                    id="websiteLink"
                    name="websiteLink"
                    placeholder="https://company.com/opportunities/apply"
                    value={formData.websiteLink}
                    onChange={handleChange}
                  />
                  {formErrors.websiteLink && <span className="validation-error">⚠️ {formErrors.websiteLink}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bankSlip">Upload Banner Image / Post *</label>
                  <input
                    className={`form-input ${formErrors.bankSlip ? 'input-error' : ''}`}
                    type="file"
                    id="bankSlip"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {formErrors.bankSlip && <span className="validation-error">⚠️ {formErrors.bankSlip}</span>}
                  {formData.bankSlip && (
                    <div style={{ marginTop: '0.75rem', textAlign: 'left' }}>
                      <span className="subtext">Preview Image Post:</span>
                      <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.25rem', maxWidth: '200px' }}>
                        <img src={formData.bankSlip} alt="Opportunity Banner Preview" style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

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
          {myJobs.map((job) => {
            const allApplicants = applicantsMap[job.id] || [];
            const selectedAppsCount = allApplicants.filter(a => a.status === 'SELECTED').length;
            
            return (
              <div key={job.id} className="job-card glass-card" style={{ display: 'block' }}>
                <div className="job-card-header">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <span className={`role-badge ${job.type === 'JOB' ? 'role-student' : job.type === 'INTERNSHIP' ? 'role-poster' : 'status-pending'}`} style={{ marginTop: '0.25rem' }}>
                      {job.type === 'JOB' ? 'Job Gig' : job.type === 'INTERNSHIP' ? 'Internship' : 'Scholarship'}
                    </span>
                    
                    {job.type === 'JOB' && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>👥 Vacancies: <strong>{job.vacancies || 1}</strong></span>
                        <span>📥 Applicants: <strong>{job.applicationCount || 0} / {job.maxApplications || 100}</strong></span>
                      </div>
                    )}
                  </div>
                  {job.type === 'JOB' ? (
                    <div className="job-budget-badge budget-secondary">
                      {job.priceRange}
                    </div>
                  ) : (
                    <div className="job-budget-badge" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      External Web Apply
                    </div>
                  )}
                </div>
                
                <div className="job-card-body">
                  {job.type !== 'JOB' && job.bankSlip && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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

                  {job.type !== 'JOB' && job.websiteLink && (
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                      🔗 Apply link: <a href={job.websiteLink} target="_blank" rel="noopener noreferrer" className="gradient-text" style={{ fontWeight: 600 }}>{job.websiteLink} ↗</a>
                    </div>
                  )}
                </div>

                <div className="job-card-footer" style={{ borderBottom: expandedJobId === job.id ? '1px solid var(--border-color)' : 'none', paddingBottom: expandedJobId === job.id ? '1rem' : '0' }}>
                  <span className="post-date">Published on {formatDate(job.createdAt)}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`status-tag status-${job.status?.toLowerCase() || 'pending'}`}>
                      ● {job.status || 'PENDING'}
                    </span>
                    {job.status === 'APPROVED' && job.type === 'JOB' && (
                      <button 
                        onClick={() => handleToggleApplicants(job.id)} 
                        className="btn btn-outline btn-sm"
                      >
                        {expandedJobId === job.id ? 'Hide Applicants' : `View Applicants (${job.applicationCount || 0})`}
                      </button>
                    )}
                    {job.status === 'APPROVED' && job.type === 'JOB' && selectedAppsCount > 0 && (
                      <button 
                        onClick={() => handleOpenCompleteModal(job)} 
                        className="btn btn-success btn-sm"
                      >
                        Complete Opportunity ✓
                      </button>
                    )}
                    {job.status === 'CLOSED' && job.signedReportSlip && (
                      <button 
                        onClick={() => setViewSlipImage(job.signedReportSlip)} 
                        className="btn btn-outline btn-sm"
                      >
                        View Signed Receipt 📄
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Applicants Table (Only valid for JOB Gigs) */}
                {expandedJobId === job.id && job.type === 'JOB' && (() => {
                  const isSelectedOnly = !!showSelectedOnlyMap[job.id];
                  const displayedApplicants = isSelectedOnly 
                    ? allApplicants.filter(app => app.status === 'SELECTED')
                    : allApplicants;

                  return (
                    <div className="applicants-table-wrapper" style={{ marginTop: '1.5rem', overflowX: 'auto', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontWeight: 700 }}>
                          Submitted Proposals (Selected: <span className="gradient-text">{selectedAppsCount} / {job.vacancies || 1}</span>)
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)', fontWeight: 600 }}>
                          <input 
                            type="checkbox" 
                            checked={isSelectedOnly} 
                            onChange={() => setShowSelectedOnlyMap(prev => ({ ...prev, [job.id]: !prev[job.id] }))} 
                            style={{ cursor: 'pointer' }}
                          />
                          Show Selected Only
                        </label>
                      </div>

                      {applicantsLoading ? (
                        <p className="subtext">Retrieving proposals...</p>
                      ) : allApplicants.length === 0 ? (
                        <p className="subtext">No candidates have applied for this opportunity yet.</p>
                      ) : isSelectedOnly && displayedApplicants.length === 0 ? (
                        <p className="subtext">No candidates have been selected for this vacancy yet.</p>
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
                            {displayedApplicants.map((app) => (
                              <tr key={app.id}>
                                <td>
                                  <strong>{app.student?.fullName}</strong>
                                  <div className="subtext">📧 {app.student?.email}</div>
                                  <div className="subtext">📞 Phone: {app.student?.phone || 'N/A'}</div>
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
                                  {app.rating && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '0.2rem', fontWeight: 600 }}>
                                      ⭐ Rating: {app.rating} / 5
                                    </div>
                                  )}
                                </td>
                                <td>
                                  {app.status === 'PENDING' ? (
                                    <button 
                                      onClick={() => handleSelectApplicant(app.id, job.id)} 
                                      className="btn btn-sm btn-primary"
                                      disabled={selectedAppsCount >= (job.vacancies || 1)}
                                    >
                                      {selectedAppsCount >= (job.vacancies || 1) ? 'Quota Full' : 'Select Candidate'}
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
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Complete opportunity and rate modal */}
      {showCompleteModal && completingJob && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Complete & Rate Candidates</h3>
              <button className="close-modal-btn" onClick={() => setShowCompleteModal(false)}>×</button>
            </div>

            <form onSubmit={handleCompleteJobSubmit}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Please rate the performance of the selected candidates before finishing the project. Ratings will be visible to the administrators.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {(applicantsMap[completingJob.id] || []).filter(app => app.status === 'SELECTED').map(app => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{app.student?.fullName}</strong>
                      <div className="subtext" style={{ fontSize: '0.75rem' }}>ID: {app.student?.studentId || app.student?.username}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating:</label>
                      <select 
                        className="form-select" 
                        style={{ padding: '0.25rem 0.5rem', width: '80px', margin: 0 }}
                        value={ratingsData[app.id] || 5}
                        onChange={(e) => handleRatingChange(app.id, e.target.value)}
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                        <option value="4">⭐⭐⭐⭐ (4)</option>
                        <option value="3">⭐⭐⭐ (3)</option>
                        <option value="2">⭐⭐ (2)</option>
                        <option value="1">⭐ (1)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Submit & Complete Opportunity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Image View Modal Overlay */}
      {viewSlipImage && (
        <div className="modal-overlay" onClick={() => setViewSlipImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3 className="modal-title">Verification Signed Receipt</h3>
              <button className="close-modal-btn" onClick={() => setViewSlipImage(null)}>×</button>
            </div>
            <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-dark)', display: 'flex', justifyContent: 'center' }}>
              <img src={viewSlipImage} alt="Signed Receipt Sheet" style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '4px', objectFit: 'contain' }} />
            </div>
            <div className="modal-footer" style={{ marginTop: '1rem', paddingTop: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setViewSlipImage(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPosterDashboard;
