import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiGrid, FiUser, FiLogOut, FiMail, FiPhone, FiAward, FiBriefcase } from 'react-icons/fi';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bio: '',
    profilePhoto: '',
    githubLink: '',
    linkedinLink: '',
    skills: '',
    currentPosition: '',
  });

  const [accountInfo, setAccountInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/api/profile');
      const data = response.data;

      setAccountInfo({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        studentId: data.studentId || '',
      });

      setFormData({
        bio: data.bio || '',
        profilePhoto: data.profilePhoto || '',
        githubLink: data.githubLink || '',
        linkedinLink: data.linkedinLink || '',
        skills: data.skills || '',
        currentPosition: data.currentPosition || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile details.');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const tempErrors = {};

    if (user?.role === 'ROLE_STUDENT') {
      if (formData.githubLink && formData.githubLink.trim() !== '') {
        const link = formData.githubLink.trim();
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
          tempErrors.githubLink = 'GitHub link must start with http:// or https://';
        } else if (!link.includes('github.com')) {
          tempErrors.githubLink = 'GitHub link must be a valid github.com address';
        }
      }

      if (formData.linkedinLink && formData.linkedinLink.trim() !== '') {
        const link = formData.linkedinLink.trim();
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
          tempErrors.linkedinLink = 'LinkedIn link must start with http:// or https://';
        } else if (!link.includes('linkedin.com')) {
          tempErrors.linkedinLink = 'LinkedIn link must be a valid linkedin.com address';
        }
      }
    }

    setFieldErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const endpoint = user?.role === 'ROLE_STUDENT' ? '/api/profile/student' : '/api/profile/job-poster';
      const payload = user?.role === 'ROLE_STUDENT'
        ? {
          bio: formData.bio,
          profilePhoto: formData.profilePhoto,
          githubLink: formData.githubLink,
          linkedinLink: formData.linkedinLink,
          skills: formData.skills,
        }
        : {
          bio: formData.bio,
          profilePhoto: formData.profilePhoto,
          currentPosition: formData.currentPosition,
        };

      const response = await API.put(endpoint, payload);
      setSuccess(response.data.message || 'Profile updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading profile configurations...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout-wrapper">
      {/* Sidebar Navigation */}
      <div className="sidebar-card">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {formData.profilePhoto ? (
              <img src={formData.profilePhoto} alt="Avatar" onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} />
            ) : (
              <span>{accountInfo.fullName?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="sidebar-info">
            <span className="sidebar-name">{accountInfo.fullName || 'User'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {user?.role === 'ROLE_STUDENT' ? '💻 Student' : '🏢 Partner'}
            </span>
          </div>
        </div>

        <div className="sidebar-menu-group">
          <span className="sidebar-menu-label">General</span>
          <Link to={user?.role === 'ROLE_STUDENT' ? '/student-dashboard' : '/job-poster-dashboard'} className="sidebar-menu-item">
            <FiGrid className="sidebar-icon" /> Dashboard
          </Link>
          <Link to="/profile" className="sidebar-menu-item active">
            <FiUser className="sidebar-icon" /> My Profile
          </Link>
          <button onClick={logout} className="sidebar-menu-item" style={{ marginTop: 'auto' }}>
            <FiLogOut className="sidebar-icon" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content-area">
        <div className="profile-settings-card glass-card">
          <h2 className="profile-title" style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'left', marginBottom: '0.25rem' }}>Account Settings</h2>
          <p className="profile-subtitle" style={{ textAlign: 'left', marginBottom: '2rem' }}>Personalize your university profile. Fields are not compulsory, but social links will validate for correctness.</p>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* User Information Section */}
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>User Information</h4>
            <div className="profile-avatar-preview-section" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="profile-avatar-frame" style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--border-color)' }}>
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} />
                ) : (
                  <div className="profile-avatar-placeholder" style={{ width: '100%', height: '100%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifySpace: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
                    {accountInfo.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="profile-meta-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{accountInfo.fullName}</h3>
                <span className="profile-badge" style={{ alignSelf: 'flex-start', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {user?.role === 'ROLE_STUDENT' ? 'Student Member' : 'Partner Member'}
                </span>
                <p className="profile-account-sub" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{accountInfo.email} | {accountInfo.phone || 'No phone'}</p>
              </div>
            </div>

            {/* Personal Information Cards Grid */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Personal Information</h4>
              <div className="grid-2">
                <div style={{ background: 'rgba(57, 63, 77, 0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FiUser /> Full Name
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-main)' }}>{accountInfo.fullName}</p>
                </div>
                <div style={{ background: 'rgba(57, 63, 77, 0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FiMail /> Email Address
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>{accountInfo.email}</p>
                </div>
                <div style={{ background: 'rgba(57, 63, 77, 0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FiPhone /> Phone Number
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-main)' }}>{accountInfo.phone || 'Not Provided'}</p>
                </div>
                <div style={{ background: 'rgba(57, 63, 77, 0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  {user?.role === 'ROLE_STUDENT' ? (
                    <>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiAward /> Student ID / Reg No
                      </span>
                      <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-main)' }}>{accountInfo.studentId || 'Not Provided'}</p>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiBriefcase /> Organization Role
                      </span>
                      <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-main)' }}>{formData.currentPosition || 'Industry Partner'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-settings-form" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem', textAlign: 'left' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Edit Portfolio Details</h4>

            <div className="form-group">
              <label className="form-label" htmlFor="profilePhoto">Profile Photo URL</label>
              <input
                className="form-input"
                type="text"
                id="profilePhoto"
                name="profilePhoto"
                placeholder="Paste image link e.g. https://example.com/avatar.jpg"
                value={formData.profilePhoto}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bio">Bio / Professional Summary</label>
              <textarea
                className="form-input form-textarea"
                id="bio"
                name="bio"
                placeholder="Tell clients or students about yourself, background, and objectives..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            {user?.role === 'ROLE_STUDENT' ? (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="githubLink">GitHub Profile Link</label>
                    <input
                      className={`form-input ${fieldErrors.githubLink ? 'input-error' : ''}`}
                      type="text"
                      id="githubLink"
                      name="githubLink"
                      placeholder="https://github.com/yourusername"
                      value={formData.githubLink}
                      onChange={handleChange}
                    />
                    {fieldErrors.githubLink && <span className="validation-error">⚠️ {fieldErrors.githubLink}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="linkedinLink">LinkedIn Profile Link</label>
                    <input
                      className={`form-input ${fieldErrors.linkedinLink ? 'input-error' : ''}`}
                      type="text"
                      id="linkedinLink"
                      name="linkedinLink"
                      placeholder="https://linkedin.com/in/yourusername"
                      value={formData.linkedinLink}
                      onChange={handleChange}
                    />
                    {fieldErrors.linkedinLink && <span className="validation-error">⚠️ {fieldErrors.linkedinLink}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="skills">Skills (Comma-separated)</label>
                  <input
                    className="form-input"
                    type="text"
                    id="skills"
                    name="skills"
                    placeholder="e.g. React, Java, Figma, Technical Writing"
                    value={formData.skills}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="currentPosition">Current Position / Title</label>
                <input
                  className="form-input"
                  type="text"
                  id="currentPosition"
                  name="currentPosition"
                  placeholder="e.g. Senior Software Engineer, HR Manager, Director"
                  value={formData.currentPosition}
                  onChange={handleChange}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary profile-submit-btn"
              disabled={submitLoading}
            >
              {submitLoading ? 'Updating Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
