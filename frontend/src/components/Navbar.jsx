import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Skill<span className="logo-accent">Share</span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-welcome">
                Hey, <strong>{user.fullName}</strong>
              </span>

              <button onClick={handleLogout} className="btn btn-outline nav-logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-item login-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary register-btn">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
