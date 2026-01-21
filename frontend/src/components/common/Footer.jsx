import React from 'react';
import { Link } from 'react-router-dom';
import { FaSeedling, FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-green-800 text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FaSeedling className="text-3xl text-white" />
              <span className="font-bold text-xl">Pakar Padi</span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed mb-4">
              Sistem pakar diagnosis penyakit tanaman padi berbasis web menggunakan metode hybrid Forward Chaining dan Certainty Factor untuk membantu petani mendeteksi penyakit tanaman padi secara dini.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-white hover:text-green-300 transition">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-green-300 transition">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-green-300 transition">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-white hover:text-green-300 transition">
                <FaYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Menu Utama */}
          <div>
            <h3 className="font-bold text-lg mb-4">Menu Utama</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-200 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-200 hover:text-white transition">
                  Tentang
                </Link>
              </li>
              <li>
                <Link to="/diagnosis" className="text-gray-200 hover:text-white transition">
                  Diagnosa
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-gray-200 hover:text-white transition">
                  Riwayat
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-200 hover:text-white transition">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="font-bold text-lg mb-4">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-green-300 mt-1 flex-shrink-0" />
                <span className="text-gray-200 text-sm">
                  Desa Trompoasri, Kec. Jabon, Sidoarjo
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <FaEnvelope className="text-green-300 flex-shrink-0" />
                <a href="mailto:issomagustian1@gmail.com" className="text-gray-200 hover:text-white transition text-sm">
                  issomagustian1@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <FaPhone className="text-green-300 flex-shrink-0" />
                <a href="https://wa.me/0895337014233" className="text-gray-200 hover:text-white transition text-sm">
                  +62 895 3370 14233
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-green-700 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-200">
            © 2025 Muchammad Issom Agustian – Sistem Pakar Diagnosis Penyakit Tanaman Padi
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Powered by Issom Corporate
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
