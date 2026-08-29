import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store.js';
import { authService } from '../services/api.js';
import { Button } from './common.jsx';
import { toast } from 'react-toastify';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    authService.logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const getNavLinks = () => {
    const baseLinks = [{ label: 'Home', path: '/' }];

    if (user?.role === 'citizen' || user?.role === 'user') {
      return [
        ...baseLinks,
        { label: 'Emergency Report', path: '/report' },
        { label: 'My Reports', path: '/my-reports' },
      ];
    }

    if (user?.role === 'authority') {
      return [
        ...baseLinks,
        { label: 'Report Incident', path: '/report' },
        { label: 'Verify Incidents', path: '/authority' },
        { label: 'Analytics', path: '/analytics' },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...baseLinks,
        { label: 'Report Incident', path: '/report' },
        { label: 'Admin Panel', path: '/admin' },
        { label: 'Live Map', path: '/map' },
        { label: 'Analytics', path: '/analytics' },
      ];
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div
            className="text-2xl font-bold text-primary-600 cursor-pointer"
            onClick={() => navigate('/')}
          >
            Disaster Management
          </div>

          {/* Center menu */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-gray-600">{user.name}</span>}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg"
              >
                {user?.name?.charAt(0) || 'U'}
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-alert-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
