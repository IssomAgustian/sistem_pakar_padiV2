import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaStethoscope, FaBrain, FaHistory, FaCheckCircle } from 'react-icons/fa';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Sistem Pakar Diagnosis Penyakit Tanaman Padi
            </h1>
            <p className="text-xl md:text-2xl mb-6 text-green-100">
              Metode Hybrid: Forward Chaining & Certainty Factor
            </p>
            <p className="text-lg mb-8 text-green-50">
              Diagnosis penyakit tanaman padi dengan akurat menggunakan sistem pakar dan teknologi AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/diagnosis"
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md transition inline-flex items-center justify-center"
              >
                <FaStethoscope className="mr-2" />
                Lakukan Diagnosa Sekarang
              </Link>
              <Link
                to="/about"
                className="px-8 py-3 bg-white hover:bg-gray-100 text-green-700 font-semibold rounded-md transition inline-flex items-center justify-center"
              >
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Fitur Unggulan</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBrain className="text-3xl text-green-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Diagnosis Berbasis Gejala</h3>
              <p className="text-gray-600">
                Diagnosis otomatis menggunakan metode Forward Chaining dengan mencocokkan gejala pada rule base
              </p>
              <Link to="/diagnosis" className="text-green-700 hover:text-green-800 font-semibold mt-4 inline-block">
                Coba Sekarang →
              </Link>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaStethoscope className="text-3xl text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Basis Pengetahuan Pakar</h3>
              <p className="text-gray-600">
                Database lengkap penyakit padi dengan metode Certainty Factor untuk perhitungan tingkat keyakinan
              </p>
              <Link to="/about" className="text-green-700 hover:text-green-800 font-semibold mt-4 inline-block">
                Pelajari →
              </Link>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHistory className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Riwayat & Solusi</h3>
              <p className="text-gray-600">
                Simpan riwayat diagnosis dan dapatkan rekomendasi solusi penanganan yang tepat
              </p>
              {isAuthenticated ? (
                <Link to="/history" className="text-green-700 hover:text-green-800 font-semibold mt-4 inline-block">
                  Lihat Riwayat →
                </Link>
              ) : (
                <Link to="/login" className="text-green-700 hover:text-green-800 font-semibold mt-4 inline-block">
                  Login →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About System Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Tentang Sistem</h2>
            <p className="text-lg text-gray-600 text-center mb-8">
              Sistem pakar ini menggunakan kombinasi metode diagnosis yang handal untuk memberikan hasil yang akurat
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <FaCheckCircle className="text-green-700 text-xl mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Forward Chaining</h4>
                  <p className="text-gray-600">Metode inferensi untuk pencocokan gejala dengan rule base</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaCheckCircle className="text-green-700 text-xl mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Certainty Factor</h4>
                  <p className="text-gray-600">Perhitungan tingkat keyakinan dengan metode MB-MD</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaCheckCircle className="text-green-700 text-xl mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">User-Friendly Interface</h4>
                  <p className="text-gray-600">Antarmuka yang mudah digunakan untuk semua kalangan</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaCheckCircle className="text-green-700 text-xl mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">AI Solution Generator</h4>
                  <p className="text-gray-600">Rekomendasi penanganan otomatis dari AI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Siap Untuk Memulai Diagnosis?</h2>
            <p className="text-xl mb-8 text-green-100">
              Daftar sekarang dan mulai diagnosis penyakit tanaman padi Anda
            </p>
            <Link
              to="/register"
              className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md transition inline-block"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
