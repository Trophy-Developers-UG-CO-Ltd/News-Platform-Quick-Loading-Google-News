/**
 * Auth API service
 * Centralized API calls for authentication
 * @module features/auth/authService
 */

import api from '../../app/axios';

const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('token');
  }
};

const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

const changePassword = async (passwordData) => {
  const response = await api.put('/auth/change-password', passwordData);
  return response.data;
};

const deactivateAccount = async (password, reason) => {
  const response = await api.post('/auth/deactivate', { password, reason });
  localStorage.removeItem('token');
  return response.data;
};

const authService = { register, login, logout, getMe, updateProfile, changePassword, deactivateAccount };
export default authService;

// MukonoTalks

