import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiUser, FiLogOut, FiBriefcase, FiUsers, FiActivity } from 'react-icons/fi';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const JobPosterDashboard = () => {
  const { user, logout } = useContext(AuthContext);
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


                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Detailed Description</label>
                  <textarea
                    className="form-input form-textarea"
                    id="description"
                    name="description"
                    placeholder="Provide details about the project requirements, deliverables, milestones..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {formErrors.description && <span className="validation-error">⚠️ {formErrors.description}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="requirements">Required Skills & Tools</label>
                  <input
                    className="form-input"
                    type="text"
                    id="requirements"
                    name="requirements"
                    placeholder="e.g. React, Node.js, REST APIs"
                    value={formData.requirements}
                    onChange={handleChange}
                  />
                  {formErrors.requirements && <span className="validation-error">⚠️ {formErrors.requirements}</span>}
                </div>


            </div>
          ) : (
            <div className="jobs-list">
              {myJobs.map((job) => (
                <div key={job.id} className="job-card glass-card">
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
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

                  <div className="job-card-footer">
                    <span className="post-date">Published on {formatDate(job.createdAt)}</span>
                    <span className="status-tag status-active">● Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPosterDashboard;
