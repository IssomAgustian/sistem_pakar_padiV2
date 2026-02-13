import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { rulesApi, diseasesApi, symptomsApi } from '../../services/adminApi';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    disease_id: '',
    symptom_ids: [],
    confidence_level: 0.8,
    min_symptom_match: 3,
    description: '',
    is_active: true,
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchRules();
    fetchDiseases();
    fetchSymptoms();
  }, [page, searchTerm]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await rulesApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      setRules(response.data.rules || response.data);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      showAlert('error', 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseases = async () => {
    try {
      const response = await diseasesApi.getAll({ limit: 100 });
      setDiseases(response.data.diseases || response.data);
    } catch (error) {
      console.error('Failed to fetch diseases:', error);
    }
  };

  const fetchSymptoms = async () => {
    try {
      const response = await symptomsApi.getAll({ limit: 100 });
      setSymptoms(response.data.symptoms || response.data);
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        disease_id: rule.disease_id,
        symptom_ids: rule.symptoms?.map(s => s.id) || rule.symptom_ids || [],
        confidence_level: rule.confidence_level || 0.8,
        min_symptom_match: rule.min_symptom_match || 3,
        description: rule.description || '',
        is_active: rule.is_active !== false,
      });
    } else {
      setEditingRule(null);
      setFormData({
        disease_id: '',
        symptom_ids: [],
        confidence_level: 0.8,
        min_symptom_match: 3,
        description: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleSymptomToggle = (symptomId) => {
    setFormData(prev => ({
      ...prev,
      symptom_ids: prev.symptom_ids.includes(symptomId)
        ? prev.symptom_ids.filter(id => id !== symptomId)
        : [...prev.symptom_ids, symptomId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.disease_id) {
      showAlert('error', 'Please select a disease');
      return;
    }

    if (formData.symptom_ids.length === 0) {
      showAlert('error', 'Please select at least one symptom');
      return;
    }

    try {
      if (editingRule) {
        await rulesApi.update(editingRule.id, formData);
        showAlert('success', 'Rule updated successfully');
      } else {
        await rulesApi.create(formData);
        showAlert('success', 'Rule created successfully');
      }
      handleCloseModal();
      fetchRules();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await rulesApi.delete(id);
      showAlert('success', 'Rule deleted successfully');
      fetchRules();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await rulesApi.toggleActive(id);
      showAlert('success', 'Rule status updated');
      fetchRules();
    } catch (error) {
      showAlert('error', 'Failed to update rule status');
    }
  };

  const getDiseaseName = (diseaseId) => {
    const disease = diseases.find(d => d.id === diseaseId);
    return disease?.name || 'Unknown';
  };

  return (
    <AdminLayout>
      <div className="admin-page space-y-6">
        {/* Header */}
        <div className="admin-page-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rules Management</h1>
            <p className="text-base-content/70 mt-1">
              Manage diagnosis rules linking diseases and symptoms
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary mt-4 md:mt-0"
          >
            <FiPlus className="mr-2" /> Add Rule
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
                  placeholder="Search rules..."
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

        {/* Rules Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No rules found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Disease</th>
                        <th>Symptoms</th>
                        <th>Confidence</th>
                        <th>Min Match</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <div className="font-bold">
                              {rule.disease?.name || getDiseaseName(rule.disease_id)}
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(rule.symptoms || []).slice(0, 3).map((symptom) => (
                                <span key={symptom.id} className="badge badge-sm badge-ghost">
                                  {symptom.code || symptom.name}
                                </span>
                              ))}
                              {(rule.symptoms || []).length > 3 && (
                                <span className="badge badge-sm">
                                  +{(rule.symptoms || []).length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <progress
                                className="progress progress-primary w-20"
                                value={rule.confidence_level * 100}
                                max="100"
                              ></progress>
                              <span className="text-sm">
                                {(rule.confidence_level * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-info">
                              {rule.min_symptom_match} symptoms
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleActive(rule.id)}
                              className="btn btn-sm btn-ghost"
                            >
                              {rule.is_active !== false ? (
                                <span className="flex items-center gap-1 text-success">
                                  <FiToggleRight className="w-5 h-5" />
                                  Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-error">
                                  <FiToggleLeft className="w-5 h-5" />
                                  Inactive
                                </span>
                              )}
                            </button>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenModal(rule)}
                                className="btn btn-sm btn-ghost"
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(rule.id)}
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
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={handleCloseModal}
            >
              <FiX />
            </button>

            <h3 className="font-bold text-lg mb-4">
              {editingRule ? 'Edit Rule' : 'Add New Rule'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Disease Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Disease *</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.disease_id}
                  onChange={(e) => setFormData({ ...formData, disease_id: e.target.value })}
                  required
                >
                  <option value="">Select a disease</option>
                  {diseases.map((disease) => (
                    <option key={disease.id} value={disease.id}>
                      {disease.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Symptoms Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Symptoms * (Selected: {formData.symptom_ids.length})
                  </span>
                </label>
                <div className="border border-base-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {symptoms.map((symptom) => (
                      <label key={symptom.id} className="label cursor-pointer justify-start">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm mr-2"
                          checked={formData.symptom_ids.includes(symptom.id)}
                          onChange={() => handleSymptomToggle(symptom.id)}
                        />
                        <span className="label-text">
                          <span className="badge badge-ghost badge-sm mr-1">{symptom.code}</span>
                          {symptom.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Confidence Level */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confidence Level *</span>
                    <span className="label-text-alt">
                      {(formData.confidence_level * 100).toFixed(0)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="range range-primary"
                    value={formData.confidence_level}
                    onChange={(e) =>
                      setFormData({ ...formData, confidence_level: parseFloat(e.target.value) })
                    }
                  />
                  <div className="w-full flex justify-between text-xs px-2 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Min Symptom Match */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Minimum Symptom Match *</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.symptom_ids.length || 10}
                    className="input input-bordered"
                    value={formData.min_symptom_match}
                    onChange={(e) =>
                      setFormData({ ...formData, min_symptom_match: parseInt(e.target.value) })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Minimum symptoms required for diagnosis
                    </span>
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
                  placeholder="Optional description or notes about this rule"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
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
                  {editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Rules;
