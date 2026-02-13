import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { usersApi } from '../../services/adminApi';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiUser,
} from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10, search: searchTerm };
      if (roleFilter !== 'all') params.role = roleFilter;

      const response = await usersApi.getAll(params);
      setUsers(response.data.users || response.data);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      showAlert('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleToggleActive = async (id) => {
    try {
      await usersApi.toggleActive(id);
      showAlert('success', 'User status updated');
      fetchUsers();
    } catch (error) {
      showAlert('error', 'Failed to update user status');
    }
  };

  const handleToggleRole = async (id) => {
    if (!window.confirm('Are you sure you want to change user role?')) return;

    try {
      await usersApi.toggleRole(id);
      showAlert('success', 'User role updated');
      fetchUsers();
    } catch (error) {
      showAlert('error', 'Failed to update user role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersApi.delete(id);
      showAlert('success', 'User deleted successfully');
      fetchUsers();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Delete failed');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="admin-page space-y-6">
        {/* Header */}
        <div className="admin-page-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-base-content/70 mt-1">
              Manage system users and their permissions
            </p>
          </div>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat bg-base-100 shadow-xl rounded-lg">
            <div className="stat-title">Total Users</div>
            <div className="stat-value text-primary">{users.length}</div>
          </div>
          <div className="stat bg-base-100 shadow-xl rounded-lg">
            <div className="stat-title">Admin Users</div>
            <div className="stat-value text-secondary">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
          <div className="stat bg-base-100 shadow-xl rounded-lg">
            <div className="stat-title">Active Users</div>
            <div className="stat-value text-success">
              {users.filter(u => u.is_active !== false).length}
            </div>
          </div>
          <div className="stat bg-base-100 shadow-xl rounded-lg">
            <div className="stat-title">Inactive Users</div>
            <div className="stat-value text-error">
              {users.filter(u => u.is_active === false).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search users..."
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
                <select
                  className="select select-bordered"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar placeholder">
                                <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                                  <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                                </div>
                              </div>
                              <div className="font-bold">{user.name}</div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <button
                              onClick={() => handleToggleRole(user.id)}
                              className="btn btn-sm btn-ghost"
                            >
                              {user.role === 'admin' ? (
                                <span className="badge badge-secondary gap-2">
                                  <FiShield /> Admin
                                </span>
                              ) : (
                                <span className="badge badge-ghost gap-2">
                                  <FiUser /> User
                                </span>
                              )}
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleActive(user.id)}
                              className="btn btn-sm btn-ghost"
                            >
                              {user.is_active !== false ? (
                                <span className="badge badge-success gap-2">
                                  <FiUserCheck /> Active
                                </span>
                              ) : (
                                <span className="badge badge-error gap-2">
                                  <FiUserX /> Inactive
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="text-sm">
                            {user.created_at ? formatDate(user.created_at) : 'N/A'}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="btn btn-sm btn-ghost text-error"
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
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

export default Users;
