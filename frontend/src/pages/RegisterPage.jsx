import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaUserPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Check individual password requirements
  const getPasswordRequirements = (password) => {
    return {
      length: password.length >= 8 && password.length <= 20,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName) {
      newErrors.fullName = 'Nama lengkap harus diisi';
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'Nama minimal 3 karakter';
    }
    if (!formData.email) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(formData.email)) {
      newErrors.email = 'Hanya email @gmail.com yang diperbolehkan';
    }
    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else {
      const requirements = getPasswordRequirements(formData.password);
      if (!requirements.length || !requirements.uppercase || !requirements.lowercase || !requirements.number) {
        newErrors.password = 'Password tidak memenuhi syarat';
      }
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak sama';
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Anda harus menyetujui syarat dan ketentuan';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      await registerUser(formData.email, formData.password, formData.fullName);
      navigate('/diagnosis');
    } catch (error) {
      setErrors({ general: error.message || 'Registrasi gagal. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    alert('Fitur Google Sign-Up akan segera tersedia');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Daftar</h2>
            <p className="text-gray-600 mt-2">Buat akun baru untuk mulai diagnosis</p>
          </div>
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap" />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masukkan email Anda" />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masukkan password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}

              {/* Password Requirements Checklist */}
              {formData.password && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Syarat Password:</p>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      {getPasswordRequirements(formData.password).length ? (
                        <FaCheckCircle className="text-green-600 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-gray-400 mr-2" />
                      )}
                      <span className={getPasswordRequirements(formData.password).length ? 'text-green-600' : 'text-gray-600'}>
                        Minimal 8 karakter, maksimal 20 karakter
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {getPasswordRequirements(formData.password).uppercase ? (
                        <FaCheckCircle className="text-green-600 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-gray-400 mr-2" />
                      )}
                      <span className={getPasswordRequirements(formData.password).uppercase ? 'text-green-600' : 'text-gray-600'}>
                        Mengandung huruf besar (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {getPasswordRequirements(formData.password).lowercase ? (
                        <FaCheckCircle className="text-green-600 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-gray-400 mr-2" />
                      )}
                      <span className={getPasswordRequirements(formData.password).lowercase ? 'text-green-600' : 'text-gray-600'}>
                        Mengandung huruf kecil (a-z)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {getPasswordRequirements(formData.password).number ? (
                        <FaCheckCircle className="text-green-600 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-gray-400 mr-2" />
                      )}
                      <span className={getPasswordRequirements(formData.password).number ? 'text-green-600' : 'text-gray-600'}>
                        Mengandung angka (0-9)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Konfirmasi password Anda" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
            <div>
              <label className="flex items-start">
                <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
                  className="w-4 h-4 mt-1 text-green-700 border-gray-300 rounded focus:ring-green-500" />
                <span className="ml-2 text-sm text-gray-600">Saya menyetujui Syarat dan Ketentuan serta Kebijakan Privasi</span>
              </label>
              {errors.acceptTerms && <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Loading...' : <><FaUserPlus className="mr-2" />Daftar</>}
            </button>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Atau daftar dengan</span></div>
            </div>
            {/* <button onClick={handleGoogleRegister}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <FaGoogle className="text-red-500 mr-2" /><span className="text-gray-700 font-medium">Sign up with Google</span>
            </button> */}
          </div>
          <p className="mt-6 text-center text-sm text-gray-600">
            Sudah punya akun? <Link to="/login" className="text-green-700 hover:text-green-800 font-semibold">Login sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
