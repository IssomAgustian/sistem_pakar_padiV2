import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { logsApi } from '../../services/adminApi';
import {
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiTrash2,
  FiFilter,
  FiActivity,
  FiEdit,
  FiUserPlus,
  FiUserMinus,
  FiSettings,
} from 'react-icons/fi';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
  ];

  useEffect(() => {
    fetchLogs();
  }, [page, searchTerm, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20, search: searchTerm };
      if (actionFilter !== 'all') params.action = actionFilter;

      const response = await logsApi.getAll(params);
      setLogs(response.data.logs || response.data);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      showAlert('error', 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleClearOldLogs = async (days) => {
    if (!window.confirm(`Are you sure you want to delete logs older than ${days} days?`)) return;

    try {
      await logsApi.clear(days);
      showAlert('success', `Logs older than ${days} days deleted`);
      fetchLogs();
    } catch (error) {
      showAlert('error', 'Failed to clear logs');
    }
  };

  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case 'create':
        return <FiUserPlus className="text-success" />;
      case 'update':
      case 'edit':
        return <FiEdit className="text-warning" />;
      case 'delete':
        return <FiUserMinus className="text-error" />;
      case 'login':
        return <FiCheckCircle className="text-info" />;
      case 'logout':
        return <FiActivity className="text-base-content/50" />;
      default:
        return <FiSettings className="text-base-content/70" />;
    }
  };

  const getActionBadge = (action) => {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'badge-success';
      case 'update':
      case 'edit':
        return 'badge-warning';
      case 'delete':
        return 'badge-error';
      case 'login':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="admin-page space-y-6">
        {/* Header */}
        <div className="admin-page-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activity Logs</h1>
            <p className="text-base-content/70 mt-1">
              Track all admin activities and system events
            </p>
          </div>
          <div className="dropdown dropdown-end mt-4 md:mt-0">
            <label tabIndex={0} className="btn btn-error btn-sm">
              <FiTrash2 className="mr-2" /> Clear Old Logs
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <button onClick={() => handleClearOldLogs(30)}>Older than 30 days</button>
              </li>
              <li>
                <button onClick={() => handleClearOldLogs(90)}>Older than 90 days</button>
              </li>
              <li>
                <button onClick={() => handleClearOldLogs(180)}>Older than 180 days</button>
              </li>
              <li>
                <button onClick={() => handleClearOldLogs(365)}>Older than 1 year</button>
              </li>
            </ul>
          </div>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search logs..."
                    className="input input-bordered w-full"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                  <button className="btn btn-square">
                    <FiSearch />
                  </button>
                </div>
              </div>

              <div className="form-control">
                <div className="input-group">
                  <span className="label">
                    <FiFilter className="mr-2" />
                  </span>
                  <select
                    className="select select-bordered w-full"
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    {actionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No logs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Description</th>
                        <th>Admin</th>
                        <th>IP Address</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span className={`badge ${getActionBadge(log.action)}`}>
                                {log.action}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="max-w-md">
                              <p className="line-clamp-2">{log.description || log.message}</p>
                              {log.details && (
                                <p className="text-xs opacity-50 line-clamp-1">
                                  {typeof log.details === 'string'
                                    ? log.details
                                    : JSON.stringify(log.details)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar placeholder">
                                <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                                  <span className="text-xs">
                                    {log.admin?.name?.charAt(0).toUpperCase() ||
                                     log.admin_name?.charAt(0).toUpperCase() || 'A'}
                                  </span>
                                </div>
                              </div>
                              <span>{log.admin?.name || log.admin_name || 'System'}</span>
                            </div>
                          </td>
                          <td className="font-mono text-sm">
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="text-sm whitespace-nowrap">
                            {formatDate(log.created_at || log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="btn-group">
                      <button
                        className="btn btn-sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        «
                      </button>
                      <button className="btn btn-sm">
                        Page {page} of {totalPages}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Logs;
