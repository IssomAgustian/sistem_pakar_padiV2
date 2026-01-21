import React, { useState } from 'react';
import { FaEnvelope, FaMapMarkerAlt, FaWhatsapp, FaCheckCircle } from 'react-icons/fa';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [charCount, setCharCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message') {
      if (value.length <= 500) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setCharCount(value.length);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setShowSuccess(true);
    setFormData({ name: '', email: '', message: '' });
    setCharCount(0);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Hubungi Kami</h1>
          <p className="text-center text-gray-600 mb-12">
            Silakan hubungi kami jika Anda memiliki pertanyaan atau membutuhkan bantuan
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Kirim Pesan</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Pesan *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Tuliskan pesan Anda di sini..."
                    ></textarea>
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {charCount}/500 karakter
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-md transition flex items-center justify-center"
                  >
                    <FaEnvelope className="mr-2" />
                    Kirim Pesan
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FaMapMarkerAlt className="text-green-700 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">Alamat Admin</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Desa Trompoasri, Kec. Jabon<br />
                      Sidoarjo, Jawa Timur 61276
                    </p>
                    <a
                      href="https://goo.gl/maps/JHoWauoyQqrY896W7?g_st=aw"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-800 text-sm font-semibold inline-flex items-center"
                    >
                      Buka di Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <FaEnvelope className="text-orange-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">Email Admin</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Untuk pertanyaan teknis dan dukungan sistem
                    </p>
                    <a
                      href="issomagustian1@gmail.com"
                      className="text-green-700 hover:text-green-800 text-sm font-semibold"
                    >
                      issomagustian1@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FaWhatsapp className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">WhatsApp</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      +62 895-3370-14233
                    </p>
                    <a
                      href="https://wa.me/0895337014233"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold transition"
                    >
                      <FaWhatsapp className="mr-2" />
                      Hubungi via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showSuccess && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in">
              <FaCheckCircle className="text-2xl" />
              <div>
                <p className="font-semibold">Pesan Terkirim!</p>
                <p className="text-sm">Terima kasih telah menghubungi kami</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
