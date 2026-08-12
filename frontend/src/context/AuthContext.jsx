import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await API.post('/api/auth/login', { username, password });
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed. Please check credentials.';
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const registerStudent = async (studentData) => {
    try {
      const response = await API.post('/api/auth/register/student', studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed.';
    }
  };

  const registerJobPoster = async (posterData) => {
    try {
      const response = await API.post('/api/auth/register/job-poster', posterData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed.';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerStudent, registerJobPoster }}>
      {children}
    </AuthContext.Provider>
  );
};
