import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { diagnosisHistoryApi } from '../../services/adminApi';
import {
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiTrash2,
  FiCalendar,
  FiFilter,
  FiX,
} from 'react-icons/fi';

const DiagnosisHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchHistory();
  }, [page, searchTerm, methodFilter, dateFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10, search: searchTerm };
      if (methodFilter !== 'all') params.method = methodFilter;
      if (dateFilter !== 'all') params.date_range = dateFilter;

      const response = await diagnosisHistoryApi.getAll(params);
      setHistory(response.data.history || response.data);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      showAlert('error', 'Failed to fetch diagnosis history');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await diagnosisHistoryApi.getById(id);
      setSelectedDiagnosis(response.data);
      setShowDetailModal(true);
    } catch (error) {
      showAlert('error', 'Failed to load diagnosis details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this diagnosis record?')) return;

    try {
      await diagnosisHistoryApi.delete(id);
      showAlert('success', 'Diagnosis record deleted');
      fetchHistory();
    } catch (error) {
      showAlert('error', 'Failed to delete record');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMethodBadge = (method) => {
    return method === 'forward_chaining' ? 'badge-primary' : 'badge-secondary';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Diagnosis History</h1>
          <p className="text-base-content/70 mt-1">
            View and manage all diagnosis records
          </p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search..."
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
                  value={methodFilter}
                  onChange={(e) => {
                    setMethodFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Methods</option>
                  <option value="forward_chaining">Forward Chaining (FC)</option>
                  <option value="certainty_factor">Certainty Factor (CF)</option>
                </select>
              </div>

              <div className="form-control">
                <select
                  className="select select-bordered"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No diagnosis records found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Disease</th>
                        <th>Method</th>
                        <th>Confidence</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar placeholder">
                                <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                                  <span className="text-xs">
                                    {record.user?.name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              </div>
                              <span>{record.user?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="font-bold">{record.disease?.name || record.disease_name}</div>
                          </td>
                          <td>
                            <span className={`badge ${getMethodBadge(record.method)}`}>
                              {record.method === 'forward_chaining' ? 'FC' : 'CF'}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <progress
                                className="progress progress-success w-20"
                                value={(record.confidence || 0) * 100}
                                max="100"
                              ></progress>
                              <span className="text-sm">
                                {((record.confidence || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="text-sm">
                            {formatDate(record.created_at)}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(record.id)}
                                className="btn btn-sm btn-ghost"
                                title="View Details"
                              >
                                <FiEye />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
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

      {/* Detail Modal */}
      {showDetailModal && selectedDiagnosis && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={() => setShowDetailModal(false)}
            >
              <FiX />
            </button>

            <h3 className="font-bold text-lg mb-4">Diagnosis Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">User:</span>
                  <p>{selectedDiagnosis.user?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-semibold">Email:</span>
                  <p>{selectedDiagnosis.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold">Disease:</span>
                  <p>{selectedDiagnosis.disease?.name}</p>
                </div>
                <div>
                  <span className="font-semibold">Method:</span>
                  <span className={`badge ${getMethodBadge(selectedDiagnosis.method)}`}>
                    {selectedDiagnosis.method === 'forward_chaining' ? 'Forward Chaining' : 'Certainty Factor'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Confidence:</span>
                  <p>{((selectedDiagnosis.confidence || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="font-semibold">Date:</span>
                  <p>{formatDate(selectedDiagnosis.created_at)}</p>
                </div>
              </div>

              <div>
                <span className="font-semibold">Selected Symptoms:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(selectedDiagnosis.symptoms || []).map((symptom, index) => (
                    <span key={index} className="badge badge-primary">
                      {symptom.name || symptom}
                    </span>
                  ))}
                </div>
              </div>

              {selectedDiagnosis.treatment && (
                <div>
                  <span className="font-semibold">Treatment:</span>
                  <p className="mt-1">{selectedDiagnosis.treatment}</p>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DiagnosisHistory;
