import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt, FaSeedling, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-green-700 hover:text-green-800 font-bold text-xl">
            <FaSeedling className="text-2xl" />
            <span>Pakar Padi</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition">
              Home
            </Link>
            <Link to="/about" className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition">
              Tentang
            </Link>
            <Link to="/diagnosis" className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition">
              Diagnosa
            </Link>
            {isAuthenticated && (
              <Link to="/history" className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition">
                Riwayat
              </Link>
            )}
            <Link to="/contact" className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition">
              Kontak
            </Link>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="ml-4 flex items-center space-x-2">
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost text-gray-700 hover:text-green-700">
                    <FaUser className="mr-2" />
                    {user?.full_name || user?.email}
                  </label>
                  <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-lg w-52 mt-2">
                    <li>
                      <a onClick={handleLogout} className="text-gray-700 hover:text-green-700 hover:bg-green-50">
                        <FaSignOutAlt className="mr-2" />
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <Link to="/login" className="ml-4 px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-700 hover:text-green-700 focus:outline-none"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition"
              >
                Tentang
              </Link>
              <Link
                to="/diagnosis"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition"
              >
                Diagnosa
              </Link>
              {isAuthenticated && (
                <Link
                  to="/history"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition"
                >
                  Riwayat
                </Link>
              )}
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition"
              >
                Kontak
              </Link>
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-gray-600 font-medium border-t mt-2 pt-2">
                    {user?.full_name || user?.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition"
                  >
                    <FaSignOutAlt className="inline mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mx-4 px-6 py-2 bg-green-700 text-white text-center rounded-md hover:bg-green-800 transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
