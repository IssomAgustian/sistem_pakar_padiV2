import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { dashboardApi } from '../../services/adminApi';
import {
  FiUsers,
  FiActivity,
  FiFileText,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
} from 'react-icons/fi';
import { GiPlantRoots, GiPlantSeed } from 'react-icons/gi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivities(10),
      ]);

      setStats(statsRes.data);
      setActivities(activitiesRes.data.activities || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="alert alert-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: <FiUsers className="w-8 h-8" />,
      color: 'bg-blue-500',
      link: '/admin/users',
      change: '+12%',
      changeType: 'increase',
    },
    {
      title: 'Total Diseases',
      value: stats?.total_diseases || 0,
      icon: <GiPlantRoots className="w-8 h-8" />,
      color: 'bg-red-500',
      link: '/admin/diseases',
    },
    {
      title: 'Total Symptoms',
      value: stats?.total_symptoms || 0,
      icon: <GiPlantSeed className="w-8 h-8" />,
      color: 'bg-green-500',
      link: '/admin/symptoms',
    },
    {
      title: 'Total Diagnoses',
      value: stats?.total_diagnoses || 0,
      icon: <FiActivity className="w-8 h-8" />,
      color: 'bg-purple-500',
      link: '/admin/diagnosis-history',
      change: '+23%',
      changeType: 'increase',
    },
    {
      title: 'Active Rules',
      value: stats?.active_rules || 0,
      icon: <FiFileText className="w-8 h-8" />,
      color: 'bg-orange-500',
      link: '/admin/rules',
    },
    {
      title: 'Today\'s Diagnoses',
      value: stats?.today_diagnoses || 0,
      icon: <FiClock className="w-8 h-8" />,
      color: 'bg-teal-500',
      link: '/admin/diagnosis-history',
    },
  ];

  const quickActions = [
    {
      title: 'Add Disease',
      description: 'Create a new disease entry',
      link: '/admin/diseases',
      icon: <GiPlantRoots className="w-6 h-6" />,
      color: 'btn-error',
    },
    {
      title: 'Add Symptom',
      description: 'Create a new symptom',
      link: '/admin/symptoms',
      icon: <GiPlantSeed className="w-6 h-6" />,
      color: 'btn-success',
    },
    {
      title: 'Add Rule',
      description: 'Create a new diagnosis rule',
      link: '/admin/rules',
      icon: <FiFileText className="w-6 h-6" />,
      color: 'btn-warning',
    },
    {
      title: 'View Reports',
      description: 'Access analytics and reports',
      link: '/admin/reports',
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: 'btn-info',
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'diagnosis':
        return <FiActivity className="text-purple-500" />;
      case 'user':
        return <FiUsers className="text-blue-500" />;
      case 'disease':
        return <GiPlantRoots className="text-red-500" />;
      case 'symptom':
        return <GiPlantSeed className="text-green-500" />;
      default:
        return <FiFileText className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="admin-page space-y-6">
        {/* Header */}
        <div className="admin-page-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
            <p className="text-base-content/70 mt-1">
              Welcome back! Here's what's happening with your system.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={fetchDashboardData}
              className="btn btn-primary btn-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base-content/70 text-sm">{stat.title}</p>
                    <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
                    {stat.change && (
                      <div className={`text-sm mt-2 flex items-center ${
                        stat.changeType === 'increase' ? 'text-success' : 'text-error'
                      }`}>
                        <FiTrendingUp className="mr-1" />
                        {stat.change} from last month
                      </div>
                    )}
                  </div>
                  <div className={`${stat.color} p-4 rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className={`btn ${action.color} h-auto py-4 flex-col items-start hover:scale-105 transition-transform`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {action.icon}
                    <span className="font-bold">{action.title}</span>
                  </div>
                  <span className="text-xs opacity-80">{action.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-xl">Recent Activities</h2>
              <Link to="/admin/logs" className="btn btn-ghost btn-sm">
                View All <FiEye className="ml-1" />
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <FiActivity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>User</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity, index) => (
                      <tr key={index}>
                        <td>
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.type)}
                            <span className="capitalize">{activity.type}</span>
                          </div>
                        </td>
                        <td>{activity.description || activity.action}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                              <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                                <span className="text-xs">
                                  {activity.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <span>{activity.user?.name || activity.admin_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="text-sm text-base-content/70">
                          {formatDate(activity.created_at || activity.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* System Health (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-success text-success-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-6 h-6" />
                <h3 className="card-title">System Status</h3>
              </div>
              <p className="text-2xl font-bold mt-2">Operational</p>
              <p className="text-sm opacity-80">All systems running smoothly</p>
            </div>
          </div>

          <div className="card bg-info text-info-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="w-6 h-6" />
                <h3 className="card-title">API Response</h3>
              </div>
              <p className="text-2xl font-bold mt-2">~45ms</p>
              <p className="text-sm opacity-80">Average response time</p>
            </div>
          </div>

          <div className="card bg-warning text-warning-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-2">
                <FiActivity className="w-6 h-6" />
                <h3 className="card-title">Database</h3>
              </div>
              <p className="text-2xl font-bold mt-2">Healthy</p>
              <p className="text-sm opacity-80">Connection stable</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
