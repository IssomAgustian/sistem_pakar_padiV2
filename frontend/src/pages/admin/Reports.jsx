import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { reportsApi } from '../../services/adminApi';
import {
  FiDownload,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedReport, setSelectedReport] = useState('disease-distribution');
  const [dateRange, setDateRange] = useState('month');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const reportTypes = [
    {
      id: 'disease-distribution',
      name: 'Disease Distribution',
      icon: <FiPieChart />,
      description: 'Distribution of diagnosed diseases'
    },
    {
      id: 'diagnosis-timeline',
      name: 'Diagnosis Timeline',
      icon: <FiTrendingUp />,
      description: 'Diagnosis trends over time'
    },
    {
      id: 'user-activity',
      name: 'User Activity',
      icon: <FiActivity />,
      description: 'User engagement metrics'
    },
    {
      id: 'method-comparison',
      name: 'Method Comparison',
      icon: <FiBarChart2 />,
      description: 'FC vs CF method usage'
    },
    {
      id: 'symptom-frequency',
      name: 'Symptom Frequency',
      icon: <FiCheckCircle />,
      description: 'Most common symptoms'
    },
    {
      id: 'accuracy-report',
      name: 'Accuracy Report',
      icon: <FiCheckCircle />,
      description: 'System accuracy metrics'
    },
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = { date_range: dateRange };
      let response;

      switch (selectedReport) {
        case 'disease-distribution':
          response = await reportsApi.getDiseaseDistribution(params);
          break;
        case 'diagnosis-timeline':
          response = await reportsApi.getDiagnosisTimeline(params);
          break;
        case 'user-activity':
          response = await reportsApi.getUserActivity(params);
          break;
        case 'method-comparison':
          response = await reportsApi.getMethodComparison(params);
          break;
        case 'symptom-frequency':
          response = await reportsApi.getSymptomFrequency(params);
          break;
        case 'accuracy-report':
          response = await reportsApi.getAccuracyReport(params);
          break;
        default:
          response = await reportsApi.getDiseaseDistribution(params);
      }

      setReportData(response.data);
    } catch (error) {
      showAlert('error', 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleExport = async (format) => {
    try {
      const response = await reportsApi.exportReport(selectedReport, {
        date_range: dateRange,
        format
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${selectedReport}-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showAlert('success', 'Report exported successfully');
    } catch (error) {
      showAlert('error', 'Failed to export report');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page space-y-6">
        {/* Header */}
        <div className="admin-page-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-base-content/70 mt-1">
              View system reports and analytics
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={() => handleExport('pdf')}
              className="btn btn-primary btn-sm"
              disabled={loading || !reportData}
            >
              <FiDownload className="mr-2" /> Export PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="btn btn-success btn-sm"
              disabled={loading || !reportData}
            >
              <FiDownload className="mr-2" /> Export Excel
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

        {/* Report Type Selection */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="font-bold text-lg mb-4">Select Report Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`card bg-base-200 hover:bg-base-300 transition-colors ${
                    selectedReport === report.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{report.icon}</div>
                      <div className="text-left">
                        <h4 className="font-bold">{report.name}</h4>
                        <p className="text-sm opacity-70">{report.description}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <span className="font-semibold">Date Range:</span>
              <div className="btn-group">
                <button
                  className={`btn btn-sm ${dateRange === 'week' ? 'btn-active' : ''}`}
                  onClick={() => setDateRange('week')}
                >
                  Week
                </button>
                <button
                  className={`btn btn-sm ${dateRange === 'month' ? 'btn-active' : ''}`}
                  onClick={() => setDateRange('month')}
                >
                  Month
                </button>
                <button
                  className={`btn btn-sm ${dateRange === 'year' ? 'btn-active' : ''}`}
                  onClick={() => setDateRange('year')}
                >
                  Year
                </button>
                <button
                  className={`btn btn-sm ${dateRange === 'all' ? 'btn-active' : ''}`}
                  onClick={() => setDateRange('all')}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Display */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="font-bold text-lg mb-4">
              {reportTypes.find(r => r.id === selectedReport)?.name}
            </h3>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                {/* Simple data visualization - could be enhanced with charting library */}
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Value</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.data || reportData).map(([key, value], index) => (
                        <tr key={index}>
                          <td className="font-semibold">{key}</td>
                          <td>{typeof value === 'number' ? value : JSON.stringify(value)}</td>
                          <td>
                            {typeof value === 'number' && (
                              <progress
                                className="progress progress-primary w-32"
                                value={value}
                                max={Math.max(...Object.values(reportData.data || {}).filter(v => typeof v === 'number'))}
                              ></progress>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats */}
                {reportData.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(reportData.summary).map(([key, value], index) => (
                      <div key={index} className="stat bg-base-200 rounded-lg">
                        <div className="stat-title">{key}</div>
                        <div className="stat-value text-primary">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-base-content/70">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;
