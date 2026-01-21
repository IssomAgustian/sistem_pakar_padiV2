import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { symptomsApi } from '../../services/adminApi';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiFilter,
} from 'react-icons/fi';

const Symptoms = () => {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'daun',
    mb_value: 0.6,
    md_value: 0.2,
    is_active: true,
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'daun', label: 'Daun (Leaf)', color: 'badge-success' },
    { value: 'batang', label: 'Batang (Stem)', color: 'badge-warning' },
    { value: 'akar', label: 'Akar (Root)', color: 'badge-error' },
    { value: 'bulir', label: 'Bulir (Grain)', color: 'badge-info' },
    { value: 'umum', label: 'Umum (General)', color: 'badge-primary' },
  ];

  useEffect(() => {
    fetchSymptoms();
  }, [page, searchTerm, categoryFilter]);

  const fetchSymptoms = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchTerm,
      };
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      const response = await symptomsApi.getAll(params);
      setSymptoms(response.data.symptoms || response.data);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      showAlert('error', 'Failed to fetch symptoms');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleOpenModal = (symptom = null) => {
    if (symptom) {
      setEditingSymptom(symptom);
      setFormData({
        code: symptom.code,
        name: symptom.name,
        description: symptom.description || '',
        category: symptom.category || 'daun',
        mb_value: symptom.mb_value || 0.6,
        md_value: symptom.md_value || 0.2,
        is_active: symptom.is_active !== false,
      });
    } else {
      setEditingSymptom(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        category: 'daun',
        mb_value: 0.6,
        md_value: 0.2,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSymptom(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      showAlert('error', 'Code and name are required');
      return;
    }

    // Validate MB/MD values
    if (formData.mb_value < 0 || formData.mb_value > 1) {
      showAlert('error', 'MB value must be between 0 and 1');
      return;
    }
    if (formData.md_value < 0 || formData.md_value > 1) {
      showAlert('error', 'MD value must be between 0 and 1');
      return;
    }

    try {
      if (editingSymptom) {
        await symptomsApi.update(editingSymptom.id, formData);
        showAlert('success', 'Symptom updated successfully');
      } else {
        await symptomsApi.create(formData);
        showAlert('success', 'Symptom created successfully');
      }
      handleCloseModal();
      fetchSymptoms();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this symptom?')) {
      return;
    }

    try {
      await symptomsApi.delete(id);
      showAlert('success', 'Symptom deleted successfully');
      fetchSymptoms();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Delete failed');
    }
  };

  const getCategoryBadge = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.color : 'badge-ghost';
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Symptoms Management</h1>
            <p className="text-base-content/70 mt-1">
              Manage rice plant disease symptoms with MB/MD values
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary mt-4 md:mt-0"
          >
            <FiPlus className="mr-2" /> Add Symptom
          </button>
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
              {/* Search */}
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search symptoms..."
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

              {/* Category Filter */}
              <div className="form-control">
                <div className="input-group">
                  <span className="label">
                    <FiFilter className="mr-2" />
                  </span>
                  <select
                    className="select select-bordered w-full"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : symptoms.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No symptoms found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>MB Value</th>
                        <th>MD Value</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symptoms.map((symptom) => (
                        <tr key={symptom.id}>
                          <td>
                            <span className="badge badge-ghost font-mono">
                              {symptom.code}
                            </span>
                          </td>
                          <td>
                            <div className="font-bold">{symptom.name}</div>
                            {symptom.description && (
                              <div className="text-sm opacity-50 line-clamp-1">
                                {symptom.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${getCategoryBadge(symptom.category)}`}>
                              {getCategoryLabel(symptom.category)}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <progress
                                className="progress progress-success w-20"
                                value={symptom.mb_value * 100}
                                max="100"
                              ></progress>
                              <span className="text-sm">{symptom.mb_value?.toFixed(2)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <progress
                                className="progress progress-error w-20"
                                value={symptom.md_value * 100}
                                max="100"
                              ></progress>
                              <span className="text-sm">{symptom.md_value?.toFixed(2)}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                symptom.is_active !== false ? 'badge-success' : 'badge-error'
                              }`}
                            >
                              {symptom.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenModal(symptom)}
                                className="btn btn-sm btn-ghost"
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(symptom.id)}
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
          <div className="modal-box max-w-2xl">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={handleCloseModal}
            >
              <FiX />
            </button>

            <h3 className="font-bold text-lg mb-4">
              {editingSymptom ? 'Edit Symptom' : 'Add New Symptom'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Symptom Code *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., G001"
                    className="input input-bordered font-mono"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={!!editingSymptom}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      {editingSymptom ? 'Code cannot be changed' : 'Unique identifier'}
                    </span>
                  </label>
                </div>

                {/* Category */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Category *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Symptom Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bercak coklat pada daun"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Detailed description of the symptom"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              {/* MB Value */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">MB Value (Measure of Belief) *</span>
                  <span className="label-text-alt">{formData.mb_value.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="range range-success"
                  value={formData.mb_value}
                  onChange={(e) =>
                    setFormData({ ...formData, mb_value: parseFloat(e.target.value) })
                  }
                />
                <div className="w-full flex justify-between text-xs px-2 mt-1">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>

              {/* MD Value */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">MD Value (Measure of Disbelief) *</span>
                  <span className="label-text-alt">{formData.md_value.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="range range-error"
                  value={formData.md_value}
                  onChange={(e) =>
                    setFormData({ ...formData, md_value: parseFloat(e.target.value) })
                  }
                />
                <div className="w-full flex justify-between text-xs px-2 mt-1">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>

              {/* Status */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Active Status</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                </label>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSymptom ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Symptoms;
