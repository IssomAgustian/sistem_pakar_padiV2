import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminUser, login } = useAdminAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (adminUser) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password, rememberMe);

      if (result.success) {
        // Show success message
        navigate('/admin/dashboard');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-success p-4 rounded-full">
              <GiPlantRoots className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Rice Plant Disease Expert System
          </p>
        </div>

        {/* Login Card */}
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold mb-6 justify-center">
              Admin Login
            </h2>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error mb-4">
                <FiAlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Default Credentials Info */}
            <div className="alert alert-info mb-4">
              <div className="flex flex-col w-full">
                <div className="font-semibold mb-1">Default Admin Credentials:</div>
                <div className="text-sm">
                  <div>Email: admin@pakar-padi.com</div>
                  <div>Password: admin123</div>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email Address</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="admin@pakar-padi.com"
                    className="input input-bordered w-full pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Password</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="input input-bordered w-full pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mr-2"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="label-text">Remember me</span>
                </label>
                <a href="#" className="label-text-alt link link-hover text-primary">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">OR</div>

            {/* Back to Home */}
            <button
              onClick={() => navigate('/')}
              className="btn btn-outline btn-success w-full"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            &copy; 2024 Rice Plant Disease Expert System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
