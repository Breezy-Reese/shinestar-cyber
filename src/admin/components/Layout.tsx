import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, loading } = useAuth(); // ✅ add loading
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) { // ✅ wait for auth check first
      navigate('/admin/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) { // ✅ show nothing while checking localStorage
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-600 mt-1">Welcome, {user?.username}</p>
        </div>
        <nav className="mt-6">
          <Link to="/admin" className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Dashboard
          </Link>
          <Link to="/admin/users" className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Users
          </Link>
          <Link to="/admin/enrollments" className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Enrollments
          </Link>
          <Link to="/admin/bookings" className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Bookings
          </Link>
          <Link to="/admin/content/courses" className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Courses
          </Link>
          <Link to="/admin/content/services" className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Services
          </Link>
          <Link to="/admin/settings" className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;