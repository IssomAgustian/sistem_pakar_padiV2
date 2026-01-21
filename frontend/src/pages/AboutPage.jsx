import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPercentage, FaSeedling, FaCheckCircle } from 'react-icons/fa';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header Section */}
      <div className="bg-green-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Tentang Sistem</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Sistem Pakar Diagnosis Penyakit Tanaman Padi adalah aplikasi berbasis web yang menggunakan kombinasi metode Forward
              Chaining dan Certainty Factor untuk membantu petani dan penyuluh pertanian dalam mendiagnosis penyakit tanaman padi
              secara akurat dan efisien.
            </p>
          </div>
        </div>
      </div>

      {/* Metode yang Digunakan */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Metode yang Digunakan</h2>
            <p className="text-gray-600">Kombinasi dua metode untuk hasil diagnosis yang akurat</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Forward Chaining Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center">
                  <FaSearch className="text-white text-2xl" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Forward Chaining</h3>
              <p className="text-gray-600 mb-6 text-center">
                Metode inferensi yang bekerja dari fakta-fakta yang diketahui menuju kesimpulan.
                Digunakan untuk mencocokkan gejala-gejala yang dipilih pengguna untuk menentukan jenis penyakit.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-700 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Analisis berdasarkan gejala visual</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-700 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Proses logika dari fakta ke kesimpulan</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-700 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Hasil diagnosis yang sistematis</span>
                </li>
              </ul>
            </div>

            {/* Certainty Factor Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                  <FaPercentage className="text-white text-2xl" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Certainty Factor</h3>
              <p className="text-gray-600 mb-6 text-center">
                Metode untuk menangani ketidakpastian dalam sistem pakar. Memberikan nilai
                kepercayaan terhadap diagnosis berdasarkan tingkat keyakinan pengguna.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaCheckCircle className="text-orange-600 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Perhitungan tingkat kepercayaan</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-orange-600 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Menangani ketidakpastian data</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-orange-600 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Hasil diagnosis dengan persentase</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Cara Kerja Sistem */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Cara Kerja Sistem</h2>
              <p className="text-gray-600">Proses diagnosis yang sistematis dan mudah dipahami</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Input Gejala</h3>
                <p className="text-gray-600">
                  Pilih gejala yang terlihat pada tanaman padi Anda
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Analisis</h3>
                <p className="text-gray-600">
                  Sistem menganalisis menggunakan Forward Chaining
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Perhitungan CF</h3>
                <p className="text-gray-600">
                  Menghitung tingkat kepastian dengan Certainty Factor
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    4
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Hasil & Solusi</h3>
                <p className="text-gray-600">
                  Dapatkan diagnosis dan rekomendasi penanganan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Siap Melakukan Diagnosis?
            </h2>
            <p className="text-green-100 text-lg mb-8">
              Gunakan sistem pakar kami untuk mendiagnosis penyakit tanaman padi Anda dengan cepat dan akurat
            </p>
            <button
              onClick={() => navigate('/diagnosis')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
            >
              <FaSeedling className="text-xl" />
              Mulai Diagnosa Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
