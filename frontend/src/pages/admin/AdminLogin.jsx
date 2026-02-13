import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
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
    <div className="admin-login-shell flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur">
          <div>
            <div className="admin-login-logo">
              <GiPlantRoots className="w-9 h-9" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Manage rice disease data, diagnosis rules, user activity, and reporting from one
              control center.
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <p className="rounded-xl border border-slate-200 bg-white/75 px-4 py-3">
              Data management untuk gejala, penyakit, dan rule diagnosis.
            </p>
            <p className="rounded-xl border border-slate-200 bg-white/75 px-4 py-3">
              Dashboard, laporan, dan log aktivitas admin secara real-time.
            </p>
            <p className="rounded-xl border border-slate-200 bg-white/75 px-4 py-3">
              Pastikan akses hanya digunakan oleh akun admin terotorisasi.
            </p>
          </div>
        </section>

        <div>
          <div className="card admin-login-card bg-base-100 shadow-2xl">
            <div className="card-body">
              <div className="admin-login-header">
                <div className="admin-login-logo lg:hidden">
                  <GiPlantRoots className="w-8 h-8" />
                </div>
                <h2 className="card-title justify-center text-2xl font-bold">Admin Login</h2>
                <p className="text-sm text-base-content/70">
                  Sign in to access the admin panel
                </p>
              </div>

              {error && (
                <div className="alert alert-error mt-5">
                  <FiAlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="alert alert-info mt-4">
                <div className="flex flex-col w-full">
                  <div className="font-semibold mb-1">Default Admin Credentials:</div>
                  <div className="text-sm">
                    <div>Email: admin@pakar-padi.com</div>
                    <div>Password: admin123</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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

                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="divider">OR</div>

              <button onClick={() => navigate('/')} className="btn btn-outline btn-success w-full">
                Back to Home
              </button>
            </div>
          </div>

          <div className="text-center mt-5 text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} Rice Plant Disease Expert System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
