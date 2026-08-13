import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="role-selection-container">
      <div className="role-selection-header">
        <h1 className="role-title">Join <span className="gradient-text">SkillBridge</span></h1>
        <p className="role-subtitle">Select your role to get started with our university community</p>
      </div>

      <div className="role-cards-grid">
        <div 
          className="role-card glass-card student-card"
          onClick={() => navigate('/register/student')}
        >
          <div className="role-icon">🎓</div>
          <h2>University Student</h2>
          <p>Register as a student to browse freelance projects, showcase your technical skills, and earn money while studying.</p>
          <button className="btn btn-primary role-btn">Apply as Student</button>
        </div>

        <div 
          className="role-card glass-card client-card"
          onClick={() => navigate('/register/job-poster')}
        >
          <div className="role-icon">💼</div>
          <h2>Industry Partner</h2>
          <p>Register as a job poster to publish technical project requirements, define budgets, and hire top-tier student talent.</p>
          <button className="btn btn-secondary role-btn">Post a Job</button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
