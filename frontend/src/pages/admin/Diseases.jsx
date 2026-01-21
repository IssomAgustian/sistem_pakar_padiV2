import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { diseasesApi } from '../../services/adminApi';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiImage,
} from 'react-icons/fi';

const Diseases = () => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingDisease, setEditingDisease] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    description: '',
    causes: '',
    symptoms: '',
    prevention: '',
    treatment: '',
    severity: 'medium',
    is_active: true,
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchDiseases();
  }, [page, searchTerm]);

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const response = await diseasesApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      setDiseases(response.data.diseases || response.data);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      showAlert('error', 'Failed to fetch diseases');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleOpenModal = (disease = null) => {
    if (disease) {
      setEditingDisease(disease);
      setFormData({
        name: disease.name,
        scientific_name: disease.scientific_name || '',
        description: disease.description || '',
        causes: disease.causes || '',
        symptoms: disease.symptoms || '',
        prevention: disease.prevention || '',
        treatment: disease.treatment || '',
        severity: disease.severity || 'medium',
        is_active: disease.is_active !== false,
      });
    } else {
      setEditingDisease(null);
      setFormData({
        name: '',
        scientific_name: '',
        description: '',
        causes: '',
        symptoms: '',
        prevention: '',
        treatment: '',
        severity: 'medium',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDisease(null);
    setFormData({
      name: '',
      scientific_name: '',
      description: '',
      causes: '',
      symptoms: '',
      prevention: '',
      treatment: '',
      severity: 'medium',
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showAlert('error', 'Disease name is required');
      return;
    }

    try {
      if (editingDisease) {
        await diseasesApi.update(editingDisease.id, formData);
        showAlert('success', 'Disease updated successfully');
      } else {
        await diseasesApi.create(formData);
        showAlert('success', 'Disease created successfully');
      }
      handleCloseModal();
      fetchDiseases();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this disease?')) {
      return;
    }

    try {
      await diseasesApi.delete(id);
      showAlert('success', 'Disease deleted successfully');
      fetchDiseases();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Delete failed');
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-error',
    };
    return badges[severity] || 'badge-info';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Diseases Management</h1>
            <p className="text-base-content/70 mt-1">
              Manage rice plant diseases and their information
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary mt-4 md:mt-0"
          >
            <FiPlus className="mr-2" /> Add Disease
          </button>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Search */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search diseases..."
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
          </div>
        </div>

        {/* Diseases Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : diseases.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No diseases found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Scientific Name</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diseases.map((disease) => (
                        <tr key={disease.id}>
                          <td>
                            <div className="font-bold">{disease.name}</div>
                            {disease.description && (
                              <div className="text-sm opacity-50 line-clamp-2">
                                {disease.description}
                              </div>
                            )}
                          </td>
                          <td className="italic text-sm">
                            {disease.scientific_name || '-'}
                          </td>
                          <td>
                            <span className={`badge ${getSeverityBadge(disease.severity)}`}>
                              {disease.severity || 'medium'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                disease.is_active !== false
                                  ? 'badge-success'
                                  : 'badge-error'
                              }`}
                            >
                              {disease.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenModal(disease)}
                                className="btn btn-sm btn-ghost"
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(disease.id)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={handleCloseModal}
            >
              <FiX />
            </button>

            <h3 className="font-bold text-lg mb-4">
              {editingDisease ? 'Edit Disease' : 'Add New Disease'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Disease Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Blast Disease"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Scientific Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Scientific Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pyricularia oryzae"
                    className="input input-bordered"
                    value={formData.scientific_name}
                    onChange={(e) =>
                      setFormData({ ...formData, scientific_name: e.target.value })
                    }
                  />
                </div>

                {/* Severity */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Severity Level</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Status */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <label className="label cursor-pointer">
                    <span className="label-text">Active</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Brief description of the disease"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              {/* Causes */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Causes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="What causes this disease"
                  value={formData.causes}
                  onChange={(e) => setFormData({ ...formData, causes: e.target.value })}
                ></textarea>
              </div>

              {/* Symptoms */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Symptoms</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Observable symptoms"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                ></textarea>
              </div>

              {/* Prevention */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Prevention</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="How to prevent this disease"
                  value={formData.prevention}
                  onChange={(e) => setFormData({ ...formData, prevention: e.target.value })}
                ></textarea>
              </div>

              {/* Treatment */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Treatment</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Treatment recommendations"
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDisease ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Diseases;
