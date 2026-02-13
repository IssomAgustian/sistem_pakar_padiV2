import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  FiHome,
  FiUsers,
  FiBarChart2,
  FiClipboard,
  FiGrid,
  FiList,
  FiLogOut,
  FiSearch,
  FiBell,
  FiSettings,
  FiMenu,
  FiX,
  FiChevronDown,
  FiAlertCircle,
} from 'react-icons/fi';
import { GiPlantRoots, GiPlantSeed } from 'react-icons/gi';

const SIDEBAR_STATE_KEY = 'admin_sidebar_expanded';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(SIDEBAR_STATE_KEY) !== 'false';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { adminUser, logout } = useAdminAuth();
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
    }
  }, [sidebarOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = useMemo(
    () => [
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
    ],
    []
  );

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const pageTitle = useMemo(() => {
    const activeItem = menuItems.find((item) => isActive(item.path));
    return activeItem ? activeItem.title : 'Admin Panel';
  }, [location.pathname, menuItems]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const getBreadcrumbs = () => {
    const titleByPath = menuItems.reduce((acc, item) => {
      acc[item.path] = item.title;
      return acc;
    }, {});

    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((segment, index) => {
      const fullPath = '/' + paths.slice(0, index + 1).join('/');
      const fallbackName = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        name: titleByPath[fullPath] || fallbackName,
        path: fullPath,
      };
    });
  };

  return (
    <div className="admin-shell">
      {mobileMenuOpen && (
        <button
          aria-label="Close sidebar"
          className="admin-mobile-overlay lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            className="btn btn-ghost btn-circle admin-icon-btn lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
          <button
            className="btn btn-ghost btn-circle admin-icon-btn hidden lg:inline-flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu className="w-6 h-6" />
          </button>

          <Link to="/admin/dashboard" className="admin-brand">
            <span className="admin-brand-icon">
              <GiPlantRoots className="w-5 h-5" />
            </span>
            <span className="admin-brand-text">
              <span className="admin-brand-title">Rice Disease Expert</span>
              <span className="admin-brand-subtitle">Admin Panel</span>
            </span>
          </Link>
        </div>

        <div className="admin-topbar-right">
          <div className="admin-search hidden md:flex">
            <FiSearch className="w-4 h-4 text-base-content/60" />
            <div className="form-control w-56">
              <input
                type="text"
                placeholder="Search menu, users, reports..."
                className="input input-bordered input-sm"
              />
            </div>
          </div>

          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle admin-icon-btn">
              <div className="indicator">
                <FiBell className="w-5 h-5" />
                <span className="badge badge-xs badge-primary indicator-item">3</span>
              </div>
            </label>
            <div
              tabIndex={0}
              className="admin-dropdown card card-compact dropdown-content mt-3 w-80"
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

          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost admin-user-button">
              <div className="avatar placeholder">
                <div className="admin-user-avatar rounded-full">
                  {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold">{adminUser?.name || 'Admin'}</span>
                <span className="text-xs text-base-content/60">
                  {adminUser?.email || 'admin@system.local'}
                </span>
              </div>
              <FiChevronDown className="hidden md:block w-4 h-4 text-base-content/60" />
            </label>
            <ul
              tabIndex={0}
              className="menu menu-compact admin-dropdown dropdown-content mt-3 p-2 rounded-box w-56"
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
      </header>

      <div className="admin-layout">
        <aside
          className={`admin-sidebar hidden lg:flex ${sidebarOpen ? 'is-open' : 'is-collapsed'}`}
        >
          <div className="admin-sidebar-head">
            <span className="admin-sidebar-label">{sidebarOpen ? 'Main Navigation' : 'Menu'}</span>
          </div>
          <nav className="admin-sidebar-nav">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive(item.path) ? 'is-active' : ''}`}
                title={!sidebarOpen ? item.title : ''}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="admin-nav-text">{item.title}</span>}
              </Link>
            ))}
          </nav>

          <button className="admin-logout-btn" onClick={handleLogout}>
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </aside>

        <aside className={`admin-sidebar admin-sidebar-mobile lg:hidden ${mobileMenuOpen ? 'is-mobile-open' : ''}`}>
          <div className="admin-sidebar-head">
            <span className="admin-sidebar-label">Main Navigation</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMobileMenuOpen(false)}>
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <nav className="admin-sidebar-nav">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive(item.path) ? 'is-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-text">{item.title}</span>
              </Link>
            ))}
          </nav>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </aside>

        <main className="admin-main">
          <div className="admin-page-head">
            <h1 className="admin-page-title">{pageTitle}</h1>
            <p className="admin-page-subtitle">
              Manage your platform with streamlined tools and insights.
            </p>
          </div>

          <div className="text-sm breadcrumbs admin-breadcrumbs">
            <ul>
              <li>
                <Link to="/admin/dashboard">Admin</Link>
              </li>
              {getBreadcrumbs().map((crumb, index) => (
                <li key={index}>
                  <Link to={crumb.path}>{crumb.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <section className="admin-content-panel">{children}</section>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
