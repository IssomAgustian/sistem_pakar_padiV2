import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  FiHome,
  FiUsers,
  FiActivity,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronRight,
  FiBell,
  FiSearch,
  FiGrid,
  FiList,
  FiClipboard,
  FiAlertCircle,
} from 'react-icons/fi';
import { GiPlantRoots, GiPlantSeed } from 'react-icons/gi';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { adminUser, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: <FiHome className="w-5 h-5" />,
    },
    {
      title: 'Diseases',
      path: '/admin/diseases',
      icon: <GiPlantRoots className="w-5 h-5" />,
    },
    {
      title: 'Symptoms',
      path: '/admin/symptoms',
      icon: <GiPlantSeed className="w-5 h-5" />,
    },
    {
      title: 'Rules',
      path: '/admin/rules',
      icon: <FiGrid className="w-5 h-5" />,
    },
    {
      title: 'Users',
      path: '/admin/users',
      icon: <FiUsers className="w-5 h-5" />,
    },
    {
      title: 'Diagnosis History',
      path: '/admin/diagnosis-history',
      icon: <FiClipboard className="w-5 h-5" />,
    },
    {
      title: 'Reports',
      path: '/admin/reports',
      icon: <FiBarChart2 className="w-5 h-5" />,
    },
    {
      title: 'Activity Logs',
      path: '/admin/logs',
      icon: <FiList className="w-5 h-5" />,
    },
    {
      title: 'Settings',
      path: '/admin/settings',
      icon: <FiSettings className="w-5 h-5" />,
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      name: path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' '),
      path: '/' + paths.slice(0, index + 1).join('/'),
    }));
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top Navbar */}
      <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
        <div className="flex-none">
          <button
            className="btn btn-square btn-ghost lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
          <button
            className="btn btn-square btn-ghost hidden lg:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1">
          <Link to="/admin/dashboard" className="btn btn-ghost normal-case text-xl">
            <GiPlantRoots className="w-6 h-6 mr-2 text-success" />
            <span className="hidden md:inline">Rice Disease Expert</span>
            <span className="badge badge-primary badge-sm ml-2">Admin</span>
          </Link>
        </div>

        <div className="flex-none gap-2">
          {/* Search */}
          <div className="form-control hidden md:block">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search..."
                className="input input-bordered input-sm"
              />
              <button className="btn btn-square btn-sm">
                <FiSearch />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <div className="indicator">
                <FiBell className="w-5 h-5" />
                <span className="badge badge-xs badge-primary indicator-item">3</span>
              </div>
            </label>
            <div
              tabIndex={0}
              className="mt-3 card card-compact dropdown-content w-80 bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h3 className="font-bold text-lg">Notifications</h3>
                <div className="space-y-2">
                  <div className="alert alert-info">
                    <FiAlertCircle />
                    <span>New user registered</span>
                  </div>
                  <div className="alert alert-warning">
                    <FiAlertCircle />
                    <span>System update available</span>
                  </div>
                  <div className="alert alert-success">
                    <FiAlertCircle />
                    <span>Backup completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                <span className="text-lg font-bold">
                  {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li className="menu-title">
                <span>{adminUser?.name || 'Admin'}</span>
                <span className="text-xs">{adminUser?.email}</span>
              </li>
              <li>
                <Link to="/admin/profile">
                  <FiUsers /> Profile
                </Link>
              </li>
              <li>
                <Link to="/admin/settings">
                  <FiSettings /> Settings
                </Link>
              </li>
              <li>
                <button onClick={handleLogout}>
                  <FiLogOut /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside
          className={`
            hidden lg:block sticky top-16 h-[calc(100vh-4rem)] bg-base-100 shadow-lg transition-all duration-300
            ${sidebarOpen ? 'w-64' : 'w-20'}
          `}
        >
          <ul className="menu p-4 overflow-y-auto">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    ${isActive(item.path) ? 'active bg-primary text-primary-content' : ''}
                    ${!sidebarOpen && 'tooltip tooltip-right'}
                  `}
                  data-tip={!sidebarOpen ? item.title : ''}
                >
                  {item.icon}
                  {sidebarOpen && <span>{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-64 h-full bg-base-100 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <ul className="menu p-4">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={isActive(item.path) ? 'active bg-primary text-primary-content' : ''}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-4 lg:p-6 transition-all duration-300`}>
          {/* Breadcrumbs */}
          <div className="text-sm breadcrumbs mb-4">
            <ul>
              {getBreadcrumbs().map((crumb, index) => (
                <li key={index}>
                  <Link to={crumb.path}>{crumb.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Page Content */}
          <div className="bg-base-100 rounded-lg shadow-lg p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
