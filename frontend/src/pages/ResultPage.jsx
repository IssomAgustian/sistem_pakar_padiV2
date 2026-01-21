import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaPrint, FaRedo, FaSave } from 'react-icons/fa';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state?.result || null;
  const fromHistory = location.state?.fromHistory || false;
  const savedToHistory = resultData?.saved_to_history !== false;

  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Show save success notification when first arriving at result page (not from history)
  useEffect(() => {
    if (!fromHistory && savedToHistory) {
      // Delay to allow page to render first
      setTimeout(() => {
        setShowSaveNotification(true);
        // Auto-hide after 4 seconds
        setTimeout(() => {
          setShowSaveNotification(false);
        }, 4000);
      }, 500);
    }
  }, [fromHistory, savedToHistory]);

  if (!resultData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Hasil Diagnosis</h2>
          <p className="text-gray-600 mb-6">Silakan lakukan diagnosis terlebih dahulu</p>
          <button
            onClick={() => navigate('/diagnosis')}
            className="px-6 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 transition"
          >
            Mulai Diagnosis
          </button>
        </div>
      </div>
    );
  }

  const fallbackResults = resultData?.disease ? [{
    disease_id: resultData.disease.id,
    disease_code: resultData.disease.code,
    disease_name: resultData.disease.name,
    cf_final: resultData.confidence || 0,
    interpretation: resultData.certainty_level || ''
  }] : [];

  const results = (resultData?.results && resultData.results.length > 0)
    ? resultData.results
    : fallbackResults;

  const primary = resultData.primary || results[0] || null;
  const disease = resultData.disease || (primary ? {
    code: primary.disease_code,
    name: primary.disease_name
  } : null);
  const confidence = primary ? (primary.cf_final ?? resultData.confidence ?? 0) : 0;
  const certaintyLevel = primary ? (primary.interpretation || resultData.certainty_level || '') : '';
  const method = resultData.method || '';
  const ai_solution = resultData.ai_solution;
  const cfPercentage = (confidence * 100).toFixed(1);
  const isInsufficient = resultData?.status === 'insufficient_match' || !savedToHistory;
  const alertMessage = resultData?.alert_message || (isInsufficient ? resultData?.message : null);
  const secondaryResults = results.slice(1);
  const warningText = !isInsufficient ? (resultData.warning || (
    results.filter(item => (item.cf_final || 0) >= 0.8).length >= 2
      ? 'INFEKSI MULTIPEL TERDETEKSI'
      : null
  )) : null;
  const preventionList = ai_solution?.pencegahan_penyakit_lain || [];
  const matchedPreventionNames = new Set(
    secondaryResults.map(item => (item.disease_name || '').toLowerCase())
  );
  const extraPreventions = preventionList.filter(
    item => item && item.penyakit && !matchedPreventionNames.has(item.penyakit.toLowerCase())
  );
  const preventionMap = new Map(
    preventionList
      .filter(item => item && item.penyakit)
      .map(item => [item.penyakit.toLowerCase(), item.langkah || []])
  );

  const getConfidenceColor = (conf) => {
    if (conf >= 0.9) return 'text-green-700 bg-green-100';
    if (conf >= 0.7) return 'text-yellow-700 bg-yellow-100';
    return 'text-orange-700 bg-orange-100';
  };

  const handlePrint = async () => {
    try {
      setIsExporting(true);
      // Use browser's print functionality
      // Add a small delay to ensure the loading state is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      window.print();
    } catch (error) {
      console.error('Print error:', error);
      alert('Gagal mencetak. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToHistory = () => {
    // Data already saved automatically during diagnosis
    // Show notification
    setShowSaveNotification(true);
    setTimeout(() => {
      setShowSaveNotification(false);
    }, 3000);
  };

  const handleNewDiagnosis = () => {
    navigate('/diagnosis');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Save Success Notification */}
      {showSaveNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slideInRight print-hide">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 max-w-md">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounceIn">
                <FaSave className="text-green-600 text-2xl animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Berhasil Disimpan!</p>
              <p className="text-sm text-green-100">Hasil diagnosis telah tersimpan di riwayat Anda</p>
            </div>
            <button
              onClick={() => setShowSaveNotification(false)}
              className="flex-shrink-0 text-white hover:text-green-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Print Header - Only visible when printing */}
      <div className="hidden print-header">
        <h1 className="text-3xl font-bold text-gray-800">Sistem Pakar Diagnosis Penyakit Tanaman Padi</h1>
        <p className="text-gray-600 mt-2">Hasil Diagnosis Penyakit</p>
        <p className="text-sm text-gray-500 mt-1">Tanggal: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-8 print-hide">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Diagnosis Penyakit Tanaman Padi</h1>
          <p className="text-green-100">Metode Hybrid: Forward Chaining & Certainty Factor</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white shadow-sm border-b print-hide">
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
                  ✓
                </div>
                <p className="text-xs mt-2 text-green-700 font-medium">Tingkat Keyakinan</p>
              </div>
              <div className="w-20 h-0.5 bg-green-700 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <p className="text-xs mt-2 font-medium text-green-700">Hasil Diagnosis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Success Icon & Title */}
        <div className="text-center mb-8 print-hide">
          <div className="inline-block bg-green-100 rounded-full p-6 mb-4">
            <FaCheckCircle className="text-green-700 text-6xl" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Diagnosis Selesai!</h2>
          <p className="text-gray-600">
            Metode: <span className="font-semibold">{method === 'forward_chaining' ? 'Forward Chaining' : 'Certainty Factor'}</span>
          </p>
        </div>

        {alertMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-5 mb-6 print-hide">
            <div className="flex items-start">
              <span className="text-yellow-600 text-2xl mr-3">!</span>
              <div>
                <p className="font-bold text-yellow-900 mb-1">Perhatian</p>
                <p className="text-yellow-800">{alertMessage}</p>
              </div>
            </div>
          </div>
        )}

        {warningText && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-5 mb-6 print-hide">
            <div className="flex items-start">
              <span className="text-red-600 text-2xl mr-3">!</span>
              <div>
                <p className="font-bold text-red-900 mb-1">Peringatan</p>
                <p className="text-red-800">{warningText}</p>
              </div>
            </div>
          </div>
        )}

        {!isInsufficient && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-t-4 border-green-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-gray-600 mb-2 uppercase font-semibold tracking-wide">Penyakit Terdeteksi</p>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">{disease?.name || 'N/A'}</h3>
              <p className="text-sm text-gray-600">Kode: <span className="font-semibold">{disease?.code || 'N/A'}</span></p>
            </div>
            <div className="flex-shrink-0">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2 uppercase font-semibold">Tingkat Keyakinan</p>
                <div className={`inline-block px-6 py-3 rounded-2xl font-bold text-3xl ${getConfidenceColor(confidence)} shadow-lg`}>
                  {cfPercentage}%
                </div>
                <p className="text-sm text-gray-700 mt-2 font-semibold">{certaintyLevel}</p>
              </div>
            </div>
          </div>

          {disease?.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                <span className="mr-2">📝</span> Deskripsi Penyakit
              </h4>
              <p className="text-gray-700 leading-relaxed">{disease.description}</p>
            </div>
          )}
          </div>
        )}

        {isInsufficient && results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-yellow-500">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Hasil Perhitungan</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sistem menampilkan hasil perhitungan berdasarkan gejala yang Anda masukkan.
            </p>
            <div className="space-y-4">
              {results.map((item, index) => {
                const percent = ((item.cf_final || 0) * 100).toFixed(1);
                return (
                  <div key={`${item.disease_code || 'disease'}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.disease_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Kode: {item.disease_code || '-'}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(item.cf_final || 0)}`}>
                        {percent}%
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Tingkat keyakinan: <span className="font-semibold">{item.interpretation || 'N/A'}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Solution */}
        {!isInsufficient && ai_solution && (
          <div className="space-y-6 mb-8">
            {/* Langkah Penanganan */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-700">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-green-700 text-white rounded-full w-10 h-10 flex items-center justify-center mr-3 text-lg flex-shrink-0">1</span>
                Langkah Penanganan
              </h3>
              <div className="bg-green-50 rounded-lg p-5">
                {ai_solution.langkah_penanganan?.length > 0 ? (
                  <ul className="space-y-3">
                    {ai_solution.langkah_penanganan.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-700 font-bold mr-3 mt-1 flex-shrink-0">{index + 1}.</span>
                        <span className="text-gray-800">{step}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">Informasi langkah penanganan belum tersedia</p>
                )}
              </div>
            </div>

            {/* Rekomendasi Obat */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-600">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-3 text-lg flex-shrink-0">2</span>
                Rekomendasi Obat
              </h3>
              <div className="bg-orange-50 rounded-lg p-5">
                {ai_solution.rekomendasi_obat?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {ai_solution.rekomendasi_obat.map((obat, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 shadow border border-orange-200">
                        <div className="flex items-start">
                          <span className="text-orange-600 text-2xl mr-3">💊</span>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-1">{obat.nama}</h4>
                            <p className="text-sm text-gray-600"><span className="font-semibold">Dosis:</span> {obat.dosis}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Informasi rekomendasi obat belum tersedia</p>
                )}
              </div>
            </div>

            {/* Panduan Penggunaan */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-3 text-lg flex-shrink-0">3</span>
                Panduan Penggunaan
              </h3>
              <div className="bg-blue-50 rounded-lg p-5">
                {ai_solution.panduan_penggunaan?.length > 0 ? (
                  <ul className="space-y-3">
                    {ai_solution.panduan_penggunaan.map((guide, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="text-gray-800">{guide}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">Informasi panduan penggunaan belum tersedia</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!isInsufficient && secondaryResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-600">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Probabilitas Penyakit Lain</h3>
            <p className="text-sm text-gray-600 mb-4">
              Penyakit berikut juga terdeteksi dengan tingkat keyakinan lebih rendah.
            </p>
            <div className="space-y-4">
              {secondaryResults.map((item, index) => {
                const percent = ((item.cf_final || 0) * 100).toFixed(1);
                const preventionSteps = preventionMap.get((item.disease_name || '').toLowerCase()) || [];
                return (
                  <div key={`${item.disease_code || 'disease'}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.disease_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Kode: {item.disease_code || '-'}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(item.cf_final || 0)}`}>
                        {percent}%
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Tingkat keyakinan: <span className="font-semibold">{item.interpretation || 'N/A'}</span>
                    </p>
                    {preventionSteps.length > 0 && (
                      <div className="mt-3 bg-blue-50 rounded-md p-3">
                        <p className="text-sm font-semibold text-blue-700 mb-2">Pencegahan singkat</p>
                        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                          {preventionSteps.map((step, stepIndex) => (
                            <li key={`${item.disease_code || 'step'}-${stepIndex}`}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {extraPreventions.length > 0 && (
              <div className="mt-4 border-t border-blue-100 pt-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-2">Ringkasan Pencegahan Penyakit Lain</h4>
                <div className="space-y-3">
                  {extraPreventions.map((item, index) => (
                    <div key={`${item.penyakit}-${index}`} className="bg-blue-50 rounded-md p-3">
                      <p className="text-sm font-semibold text-gray-800">{item.penyakit}</p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1 mt-2">
                        {(item.langkah || []).map((step, stepIndex) => (
                          <li key={`${item.penyakit}-${stepIndex}`}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 print-hide">
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            {!isInsufficient && (
              <button
                onClick={handlePrint}
                disabled={isExporting}
                className="flex items-center justify-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <FaPrint className="mr-2" />
                    Print / Export PDF
                  </>
                )}
              </button>
            )}
            {!isInsufficient && !fromHistory && (
              <button
                onClick={handleViewHistory}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <FaSave className="mr-2" />
                Lihat di Riwayat
              </button>
            )}
            <button
              onClick={handleNewDiagnosis}
              className="flex items-center justify-center px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition font-semibold"
            >
              <FaRedo className="mr-2" />
              Diagnosa Ulang
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-5 text-sm print-hide">
          <div className="flex items-start">
            <span className="text-yellow-600 text-2xl mr-3 flex-shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-yellow-900 mb-1">Catatan Penting</p>
              <p className="text-yellow-800">
                Hasil diagnosis ini bersifat indikatif dan sebagai panduan awal.
                Untuk penanganan yang tepat dan akurat, sangat disarankan untuk berkonsultasi
                dengan ahli pertanian atau petugas penyuluh lapangan di daerah Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
