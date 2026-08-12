import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleCTA = () => {
    if (user) {
      if (user.role === 'ROLE_STUDENT') {
        navigate('/student-dashboard');
      } else {
        navigate('/job-poster-dashboard');
      }
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <span className="badge">🎓 For University Students & Industry Partners</span>
        <h1 className="hero-title">
          Connect. Collaborate. <span className="gradient-text">Earn.</span>
        </h1>
        <p className="hero-description">
          SkillShare is the exclusive freelancing platform for university students to share their expertise, execute high-quality projects, and gain real-world industrial experience while earning income.
        </p>
        <div className="hero-ctas">
          <button onClick={handleCTA} className="btn btn-primary cta-btn-large">
            Get Started
          </button>
          {!user && (
            <button onClick={() => navigate('/login')} className="btn btn-outline cta-btn-large">
              Log In
            </button>
          )}
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card glass-card">
          <div className="feature-icon">🚀</div>
          <h3>For Students</h3>
          <p>Browse available gig requests from verified industry partners. Set your proposals, work on technical tasks, and earn competitive payouts.</p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon">💡</div>
          <h3>For Partners</h3>
          <p>Access a pool of motivated and skilled university students in engineering, IT, design, and content writing. Post jobs with custom requirements.</p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon">🛡️</div>
          <h3>Secure & Verified</h3>
          <p>Platform security is built-in. Student profiles are verified with academic IDs, and JWT token authentication secures all data and requests.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
