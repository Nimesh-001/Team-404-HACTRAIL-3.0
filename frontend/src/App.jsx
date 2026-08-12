import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import RoleSelection from './pages/RoleSelection';
import StudentRegister from './pages/StudentRegister';
import JobPosterRegister from './pages/JobPosterRegister';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import JobPosterDashboard from './pages/JobPosterDashboard';
import ProfileSettings from './pages/ProfileSettings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<RoleSelection />} />
              <Route path="/register/student" element={<StudentRegister />} />
              <Route path="/register/job-poster" element={<JobPosterRegister />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route 
                path="/student-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/job-poster-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ROLE_JOB_POSTER']}>
                    <JobPosterDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
