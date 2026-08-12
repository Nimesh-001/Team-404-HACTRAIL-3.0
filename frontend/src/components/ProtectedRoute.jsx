import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Verifying authentication details...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this route, redirect to their respective dashboard
    if (user.role === 'ROLE_STUDENT') {
      return <Navigate to="/student-dashboard" replace />;
    } else if (user.role === 'ROLE_JOB_POSTER') {
      return <Navigate to="/job-poster-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
