import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/adminApi';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');

      if (token && storedUser) {
        setAdminUser(JSON.parse(storedUser));
        // Optionally verify token with backend
        try {
          const response = await authApi.getCurrentUser();
          setAdminUser(response.data.user);
          localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        } catch (err) {
          // Token invalid, clear storage
          logout();
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.login({ email, password });
      const { token, user } = response.data;

      // Check if user is admin
      if (user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store token and user
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem('adminRememberMe', 'true');
      }

      setAdminUser(user);
      return { success: true, user };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await authApi.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      // Clear storage regardless of API call result
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminRememberMe');
      setAdminUser(null);
      window.location.href = '/admin/login';
    }
  };

  const updateUser = (userData) => {
    setAdminUser(userData);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const isAuthenticated = () => {
    return !!adminUser && !!localStorage.getItem('adminToken');
  };

  const hasPermission = (permission) => {
    // In this system, all admins have all permissions
    // But you can extend this for role-based permissions
    return adminUser?.role === 'admin';
  };

  const value = {
    adminUser,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasPermission,
    checkAuthStatus,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
