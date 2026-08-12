import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiUser, FiLogOut, FiCode, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const StudentDashboard = () => {

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


              </div>
            </div>
            <div className="stat-card stat-indigo">
              <span className="stat-icon"><FiBriefcase className="stat-icon-svg" /></span>
              <div className="stat-details">
                <span className="stat-label">Applied Gigs</span>
                <span className="stat-value">8 Projects</span>
              </div>

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
dev
    </div>
  );
};

export default StudentDashboard;
