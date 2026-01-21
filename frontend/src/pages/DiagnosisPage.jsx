import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSearch, FaTimes, FaSeedling, FaLeaf } from 'react-icons/fa';
import { GiWheat, GiPlantRoots, GiGrainBundle, GiPlantSeed } from 'react-icons/gi';
import { MdTimeline } from 'react-icons/md';
import api from '../services/api';

const DiagnosisPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const symptomsPerPage = 12;
  const [error, setError] = useState('');

  const categories = [
    { id: 'Semua', name: 'Semua', icon: '🔍' },
    { id: 'Daun', name: 'Daun', icon: '🍃' },
    { id: 'Batang', name: 'Batang', icon: '🌿' },
    { id: 'Akar', name: 'Akar', icon: '🌱' },
    { id: 'Bulir', name: 'Bulir', icon: '🌾' },
    { id: 'Malai', name: 'Malai', icon: '🌾' },
    { id: 'Pertumbuhan', name: 'Pertumbuhan', icon: '📊' }
  ];

  // Fetch symptoms from backend
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        setLoading(true);
        const response = await api.get('/symptoms');
        if (response.data.success) {
          setSymptoms(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching symptoms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSymptoms();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Filter symptoms
  const filteredSymptoms = symptoms.filter(symptom => {
    const matchesCategory = activeCategory === 'Semua' ||
      (symptom.category && symptom.category.toLowerCase() === activeCategory.toLowerCase());
    const matchesSearch = symptom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          symptom.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const indexOfLastSymptom = currentPage * symptomsPerPage;
  const indexOfFirstSymptom = indexOfLastSymptom - symptomsPerPage;
  const currentSymptoms = filteredSymptoms.slice(indexOfFirstSymptom, indexOfLastSymptom);
  const totalPages = Math.ceil(filteredSymptoms.length / symptomsPerPage);

  const handleSymptomToggle = (symptomId) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptomId)) {
        return prev.filter(id => id !== symptomId);
      } else {
        return [...prev, symptomId];
      }
    });
  };

  const handleSubmitDiagnosis = async () => {
    // Validate minimum 3 symptoms
    if (selectedSymptoms.length < 3) {
      setError('Silakan pilih minimal 3 gejala untuk diagnosis yang akurat');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError('');

    const selectedSymptomsData = symptoms.filter(s => selectedSymptoms.includes(s.id));
    navigate('/certainty-input', {
      state: {
        symptoms: selectedSymptomsData,
        symptomIds: selectedSymptoms
      }
    });
  };

  const clearSelection = () => {
    setSelectedSymptoms([]);
  };

  const getCategoryIcon = (category) => {
    const categoryLower = category?.toLowerCase();
    switch (categoryLower) {
      case 'daun':
        return <FaLeaf className="text-green-600" />;
      case 'batang':
        return <GiPlantRoots className="text-green-700" />;
      case 'akar':
        return <GiPlantSeed className="text-amber-700" />;
      case 'bulir':
        return <GiGrainBundle className="text-yellow-600" />;
      case 'malai':
        return <GiWheat className="text-yellow-700" />;
      case 'pertumbuhan':
        return <MdTimeline className="text-blue-600" />;
      default:
        return <FaSeedling className="text-green-500" />;
    }
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Diagnosis Penyakit Tanaman Padi</h1>
          <p className="text-green-100">Metode Hybrid: Forward Chaining & Certainty Factor</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <p className="text-xs mt-2 font-medium text-green-700">Pilih Gejala</p>
              </div>
              <div className="w-20 h-0.5 bg-gray-300 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <p className="text-xs mt-2 text-gray-500">Tingkat Keyakinan</p>
              </div>
              <div className="w-20 h-0.5 bg-gray-300 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <p className="text-xs mt-2 text-gray-500">Hasil Diagnosis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Daftar Gejala Penyakit</h2>
          <p className="text-gray-600">Pilih gejala yang diamati pada tanaman padi Anda</p>
        </div>

        {/* Info Box - Minimum Symptoms */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="text-blue-500 text-2xl mr-3">💡</div>
            <div>
              <p className="text-blue-900 font-semibold mb-1">Panduan Diagnosis</p>
              <p className="text-blue-800 text-sm">
                Pilih <strong>minimal 3 gejala</strong> yang Anda amati pada tanaman padi untuk mendapatkan hasil diagnosis yang akurat.
                Sistem akan menggunakan metode <strong>Forward Chaining</strong> jika gejala sesuai rule base, atau
                <strong> Certainty Factor</strong> untuk menghitung tingkat kesesuaian.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="text-red-500 text-2xl mr-3">⚠️</div>
                <div>
                  <p className="text-red-900 font-semibold mb-1">Error</p>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 font-bold text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari gejala..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeCategory === category.id
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
            <p className="text-gray-600 mt-4">Memuat gejala...</p>
          </div>
        ) : (
          <>
            {/* Symptoms Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {currentSymptoms.map(symptom => (
                <div
                  key={symptom.id}
                  onClick={() => handleSymptomToggle(symptom.id)}
                  className={`bg-white p-4 rounded-lg shadow cursor-pointer transition transform hover:scale-105 ${
                    selectedSymptoms.includes(symptom.id)
                      ? 'ring-2 ring-green-700 bg-green-50'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1 ${
                      selectedSymptoms.includes(symptom.id)
                        ? 'bg-green-700 border-green-700'
                        : 'border-gray-300'
                    }`}>
                      {selectedSymptoms.includes(symptom.id) && (
                        <FaCheckCircle className="text-white text-xs" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(symptom.category)}</span>
                        <span className="text-xs font-semibold text-gray-600 capitalize">
                          {symptom.category || 'Umum'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{symptom.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredSymptoms.length === 0 && (
              <div className="text-center py-12">
                <FaSearch className="text-gray-400 text-5xl mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada gejala yang sesuai dengan pencarian Anda</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-md font-medium ${
                        currentPage === number
                          ? 'bg-green-700 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Menampilkan {indexOfFirstSymptom + 1} - {Math.min(indexOfLastSymptom, filteredSymptoms.length)} dari {filteredSymptoms.length} gejala
                </p>
              </div>
            )}

            {/* Selection Summary - Moved to bottom */}
            {selectedSymptoms.length > 0 && (
              <div className="bg-green-50 border-l-4 border-green-700 p-4 rounded-r-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="text-green-700 text-2xl" />
                    <div>
                      <p className="text-gray-800 font-semibold">
                        Menampilkan {filteredSymptoms.length} dari {symptoms.length} gejala • {selectedSymptoms.length} gejala dipilih
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition border border-red-200"
                    >
                      <FaTimes className="inline mr-1" />
                      Hapus Semua
                    </button>
                    <button
                      onClick={handleSubmitDiagnosis}
                      className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md transition flex items-center"
                    >
                      Lanjutkan →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DiagnosisPage;
