import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { settingsApi } from '../../services/adminApi';
import { FiSave, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const Settings = () => {
  const [settings, setSettings] = useState({
    history_retention_days: 90,
    max_diagnoses_per_day: 10,
    ai_provider: 'openai',
    enable_ai_solutions: true,
    enable_email_notifications: false,
    enable_user_registration: true,
    maintenance_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAll();
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      showAlert('error', 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsApi.bulkUpdate(settings);
      showAlert('success', 'Settings saved successfully');
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default?')) return;

    try {
      setSaving(true);
      await settingsApi.reset();
      showAlert('success', 'Settings reset to default');
      fetchSettings();
    } catch (error) {
      showAlert('error', 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-base-content/70 mt-1">
              Configure system parameters and preferences
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={handleReset}
              className="btn btn-ghost btn-sm"
              disabled={saving}
            >
              <FiRefreshCw className="mr-2" /> Reset to Default
            </button>
            <button
              onClick={handleSave}
              className={`btn btn-primary btn-sm ${saving ? 'loading' : ''}`}
              disabled={saving}
            >
              <FiSave className="mr-2" /> Save Changes
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* General Settings */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">General Settings</h2>

            <div className="space-y-4 mt-4">
              {/* History Retention */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">History Retention Days</span>
                  <span className="label-text-alt">{settings.history_retention_days} days</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="30"
                  className="range range-primary"
                  value={settings.history_retention_days}
                  onChange={(e) => handleChange('history_retention_days', parseInt(e.target.value))}
                />
                <div className="w-full flex justify-between text-xs px-2 mt-1">
                  <span>30 days</span>
                  <span>180 days</span>
                  <span>365 days</span>
                </div>
                <label className="label">
                  <span className="label-text-alt">
                    Diagnosis history older than this will be automatically deleted
                  </span>
                </label>
              </div>

              {/* Max Diagnoses Per Day */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Max Diagnoses Per Day</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="input input-bordered"
                  value={settings.max_diagnoses_per_day}
                  onChange={(e) => handleChange('max_diagnoses_per_day', parseInt(e.target.value))}
                />
                <label className="label">
                  <span className="label-text-alt">
                    Maximum number of diagnoses a user can perform per day
                  </span>
                </label>
              </div>

              {/* AI Provider */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">AI Provider</span>
                </label>
                <select
                  className="select select-bordered"
                  value={settings.ai_provider}
                  onChange={(e) => handleChange('ai_provider', e.target.value)}
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">
                    AI provider for generating treatment recommendations
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Feature Toggles</h2>

            <div className="space-y-4 mt-4">
              {/* Enable AI Solutions */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <div>
                    <span className="label-text font-semibold">Enable AI Solutions</span>
                    <p className="text-sm opacity-70">
                      Use AI to generate treatment recommendations
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={settings.enable_ai_solutions}
                    onChange={(e) => handleChange('enable_ai_solutions', e.target.checked)}
                  />
                </label>
              </div>

              {/* Enable Email Notifications */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <div>
                    <span className="label-text font-semibold">Enable Email Notifications</span>
                    <p className="text-sm opacity-70">
                      Send email notifications to users
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={settings.enable_email_notifications}
                    onChange={(e) => handleChange('enable_email_notifications', e.target.checked)}
                  />
                </label>
              </div>

              {/* Enable User Registration */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <div>
                    <span className="label-text font-semibold">Enable User Registration</span>
                    <p className="text-sm opacity-70">
                      Allow new users to register
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={settings.enable_user_registration}
                    onChange={(e) => handleChange('enable_user_registration', e.target.checked)}
                  />
                </label>
              </div>

              {/* Maintenance Mode */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <div>
                    <span className="label-text font-semibold">Maintenance Mode</span>
                    <p className="text-sm opacity-70">
                      Put system in maintenance mode (users cannot access)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-error"
                    checked={settings.maintenance_mode}
                    onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">System Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <span className="font-semibold">Version:</span>
                <p>1.0.0</p>
              </div>
              <div>
                <span className="font-semibold">Database:</span>
                <p>PostgreSQL 15</p>
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-semibold">Uptime:</span>
                <p>24 days, 5 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
