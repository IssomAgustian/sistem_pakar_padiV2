  import React, { useState, useEffect } from 'react';
  import { useAuth } from '../context/AuthContext';
  import { Navigate, Link, useNavigate } from 'react-router-dom';
  import { FaHistory, FaCalendar, FaEye, FaDownload, FaSearch, FaFilter } from 'react-icons/fa';
  import historyService from '../services/historyService';

  const HistoryPage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState(null);
    const itemsPerPage = 10;

    // Fetch history data from backend
    useEffect(() => {
      const fetchHistory = async () => {
        try {
          setLoading(true);
          setError('');
          const result = await historyService.getUserHistory(currentPage, itemsPerPage);
          setHistoryData(result.data);
          setPagination(result.pagination);
        } catch (err) {
          console.error('Error fetching history:', err);
          setError('Gagal memuat riwayat diagnosis');
        } finally {
          setLoading(false);
        }
      };

      if (isAuthenticated) {
        fetchHistory();
      }
    }, [isAuthenticated, currentPage]);

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    const filteredHistory = historyData.filter(item => {
      // For API data structure
      const diseaseName = item.disease?.name || '';
      const matchesSearch = diseaseName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (filterDate !== 'all') {
        const itemDate = new Date(item.diagnosis_date);
        const today = new Date();
        const daysDiff = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));

        if (filterDate === 'today') matchesDate = daysDiff === 0;
        else if (filterDate === 'week') matchesDate = daysDiff <= 7;
        else if (filterDate === 'month') matchesDate = daysDiff <= 30;
      }

      return matchesSearch && matchesDate;
    });

    const totalPages = pagination?.pages || 1;
    const paginatedHistory = filteredHistory;

    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const getConfidenceColor = (confidence) => {
      if (confidence >= 0.9) return 'text-green-700 bg-green-100';
      if (confidence >= 0.7) return 'text-yellow-700 bg-yellow-100';
      return 'text-orange-700 bg-orange-100';
    };

    const handleViewDetail = async (historyId) => {
      try {
        const detail = await historyService.getHistoryDetail(historyId);
        navigate('/result', {
          state: {
            result: {
              disease: detail.disease,
              confidence: detail.final_cf_value,
              certainty_level: detail.certainty_level,
              method: detail.diagnosis_method,
              ai_solution: detail.ai_solution_json,
              results: detail.diagnosis_results || []
            },
            fromHistory: true
          }
        });
      } catch (err) {
        console.error('Error fetching detail:', err);
        alert('Gagal memuat detail riwayat');
      }
    };

    const handleExportPDF = async (historyId) => {
      try {
        await historyService.exportHistoryToPDF(historyId);
      } catch (err) {
        console.error('Error exporting PDF:', err);
        alert('Gagal mengekspor PDF. Fitur ini akan segera tersedia.');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Riwayat Diagnosis</h1>
            <p className="text-gray-600">Lihat histori diagnosis penyakit tanaman padi Anda</p>
          </div>

          {/* Loading State for Stats */}
          {loading ? (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Diagnosis</p>
                    <p className="text-3xl font-bold text-gray-800">{pagination?.total || 0}</p>
                  </div>
                  <FaHistory className="text-green-700 text-3xl" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Bulan Ini</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {historyData.filter(h => {
                        const date = new Date(h.diagnosis_date);
                        const now = new Date();
                        return date.getMonth() === now.getMonth();
                      }).length}
                    </p>
                  </div>
                  <FaCalendar className="text-orange-600 text-3xl" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Rata-rata Confidence</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {historyData.length > 0
                        ? Math.round((historyData.reduce((acc, h) => acc + (h.final_cf_value || 0), 0) / historyData.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <FaFilter className="text-blue-600 text-3xl" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari penyakit atau gejala..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500
  focus:border-transparent"
                />
              </div>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"    
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">30 Hari Terakhir</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedHistory.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <FaHistory className="text-gray-400 text-5xl mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Belum ada riwayat diagnosis</p>
                  <Link
                    to="/diagnosis"
                    className="inline-block mt-4 px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition"
                  >
                    Mulai Diagnosis
                  </Link>
                </div>
              ) : (
                paginatedHistory.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{item.disease?.name || 'N/A'}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(item.final_cf_value)}`}>
                            {Math.round((item.final_cf_value || 0) * 100)}% CF
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <FaCalendar className="mr-2" />
                            {formatDate(item.diagnosis_date)}
                          </div>
                          <div>
                            <span className="font-medium">{item.selected_symptoms?.length || 0} gejala</span> terdeteksi
                          </div>
                          <div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {item.diagnosis_method === 'forward_chaining' ? 'Forward Chaining' : 'Certainty Factor'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">{item.certainty_level}</span>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <button
                          onClick={() => handleViewDetail(item.id)}
                          className="flex-1 md:flex-none px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition flex items-center justify-center"
                        >
                          <FaEye className="mr-2" />
                          Lihat Detail
                        </button>
                        <button
                          onClick={() => handleExportPDF(item.id)}
                          className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center justify-center"
                        >
                          <FaDownload className="mr-2" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-md transition ${
                        currentPage === pageNum
                          ? 'bg-green-700 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
export default HistoryPage;
