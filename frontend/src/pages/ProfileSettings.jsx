import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user } = useContext(AuthContext);

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
    <div className="profile-settings-container">
      <div className="profile-settings-card glass-card">
        <h2 className="profile-title">Edit <span className="gradient-text">Portfolio & Profile</span></h2>
        <p className="profile-subtitle">Personalize your university profile. Fields are not compulsory, but social links will validate for correctness.</p>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="profile-avatar-preview-section">
          <div className="profile-avatar-frame">
            {formData.profilePhoto ? (
              <img src={formData.profilePhoto} alt="Profile Preview" onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} />
            ) : (
              <div className="profile-avatar-placeholder">
                {accountInfo.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-meta-info">
            <h3>{accountInfo.fullName}</h3>
            <span className="profile-badge">{user?.role === 'ROLE_STUDENT' ? '💻 Student Member' : '🏢 Partner Member'}</span>
            <p className="profile-account-sub">{accountInfo.email} | {accountInfo.phone}</p>
            {accountInfo.studentId && <p className="profile-student-id">Student Reg No: <strong>{accountInfo.studentId}</strong></p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-settings-form">
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
  );
};

export default ProfileSettings;
