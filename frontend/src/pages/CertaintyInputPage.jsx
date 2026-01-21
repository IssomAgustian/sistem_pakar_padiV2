import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import diagnosisService from '../services/diagnosisService';

const CertaintyInputPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const symptoms = location.state?.symptoms || [];
  const symptomIds = location.state?.symptomIds || [];

  const [certaintyValues, setCertaintyValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const certaintyOptions = {
    'pasti': { label: 'Pasti', value: 1.0, description: '100% - Anda sangat yakin gejala ini ada' },
    'hampir_pasti': { label: 'Hampir Pasti', value: 0.8, description: '80% - Anda hampir yakin gejala ini ada' },
    'kemungkinan_besar': { label: 'Kemungkinan Besar', value: 0.6, description: '60% - Kemungkinan besar gejala ini ada' },
    'mungkin': { label: 'Mungkin', value: 0.4, description: '40% - Mungkin gejala ini ada' },
    'tidak_yakin': { label: 'Tidak Yakin', value: 0.2, description: '20% - Anda tidak yakin' }
  };

  const handleCertaintyChange = (symptomId, certaintyKey) => {
    setCertaintyValues(prev => ({
      ...prev,
      [symptomId]: certaintyKey
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all symptoms have certainty values
    const missingCertainty = symptomIds.filter(id => !certaintyValues[id]);
    if (missingCertainty.length > 0) {
      setError('Mohon pilih tingkat keyakinan untuk semua gejala');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert certainty keys to values
      const certaintyValuesWithNumbers = {};
      Object.keys(certaintyValues).forEach(symptomId => {
        const key = certaintyValues[symptomId];
        certaintyValuesWithNumbers[symptomId] = certaintyOptions[key].value;
      });

      // Call diagnosis API with certainty values
      const result = await diagnosisService.diagnoseBySymptoms(symptomIds, certaintyValuesWithNumbers);

      if (!result.success) {
        throw new Error(result.message || 'Diagnosis gagal');
      }

      if (result.status === 'diagnosed' || result.status === 'insufficient_match') {
        navigate('/result', {
          state: {
            result: {
              results: result.data.results || [],
              primary: result.data.primary,
              disease: result.data.disease,
              confidence: result.data.confidence || 0,
              certainty_level: result.data.certainty_level || getCertaintyLevel(result.data.confidence),
              method: result.method || 'certainty_factor',
              warning: result.data.warning,
              recommendations: result.data.recommendations || [],
              ai_solution: result.data.ai_solution,
              status: result.status,
              alert_message: result.data.alert_message || result.message,
              saved_to_history: result.data.saved_to_history
            }
          }
        });
      } else {
        throw new Error('Status diagnosis tidak dikenal');
      }
    } catch (err) {
      console.error('Certainty submission error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses diagnosis');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine certainty level from CF value
  const getCertaintyLevel = (cfValue) => {
    if (cfValue >= 0.9) return 'Sangat Yakin';
    if (cfValue >= 0.7) return 'Yakin';
    if (cfValue >= 0.5) return 'Cukup Yakin';
    if (cfValue >= 0.3) return 'Kurang Yakin';
    return 'Tidak Yakin';
  };

  if (symptoms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-yellow-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Gejala</h2>
          <p className="text-gray-600 mb-6">Silakan pilih gejala terlebih dahulu</p>
          <button
            onClick={() => navigate('/diagnosis')}
            className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-md transition"
          >
            Kembali ke Diagnosis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-8">
        <div className="container mx-auto px-4">
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
                  ✓
                </div>
                <p className="text-xs mt-2 text-green-700 font-medium">Pilih Gejala</p>
              </div>
              <div className="w-20 h-0.5 bg-green-700 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <p className="text-xs mt-2 font-medium text-green-700">Tingkat Keyakinan</p>
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
        <div className="max-w-4xl mx-auto">
          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <div className="text-blue-500 text-2xl mr-3">ℹ️</div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Tentukan Tingkat Keyakinan</h3>
                <p className="text-blue-800 text-sm">
                  Gejala yang Anda pilih tidak sepenuhnya cocok dengan rule base yang ada.
                  Mohon tentukan tingkat keyakinan Anda untuk setiap gejala agar sistem dapat menghitung diagnosis dengan metode Certainty Factor.
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
                    <h3 className="font-bold text-red-900 mb-1">Error</h3>
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 mb-8">
              {symptoms.map((symptom, index) => (
                <div key={symptom.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-700">
                  <div className="flex items-start mb-4">
                    <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">
                        {symptom.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Kode: <span className="font-semibold">{symptom.code}</span> •
                        Kategori: <span className="font-semibold capitalize">{symptom.category}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pl-11">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Seberapa yakin Anda dengan gejala ini?
                    </label>

                    <div className="space-y-2">
                      {Object.entries(certaintyOptions).map(([key, option]) => (
                        <label
                          key={key}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition ${
                            certaintyValues[symptom.id] === key
                              ? 'border-green-700 bg-green-50'
                              : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`certainty-${symptom.id}`}
                            value={key}
                            checked={certaintyValues[symptom.id] === key}
                            onChange={() => handleCertaintyChange(symptom.id, key)}
                            className="w-5 h-5 text-green-700 focus:ring-green-500 mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800">{option.label}</span>
                              <span className="text-sm font-bold text-green-700">
                                {(option.value * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => navigate('/diagnosis')}
                className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition"
              >
                ← Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Proses Diagnosis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CertaintyInputPage;
