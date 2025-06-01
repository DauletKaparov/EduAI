import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white shadow">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">EduAI</span>
              </Link>
              <div className="hidden ml-10 space-x-8 lg:block">
                <Link to="/" className="text-base font-medium text-gray-700 hover:text-primary-600">
                  Home
                </Link>
                {user && (
                  <>
                    <Link to="/dashboard" className="text-base font-medium text-gray-700 hover:text-primary-600">
                      Dashboard
                    </Link>
                    <Link to="/subjects" className="text-base font-medium text-gray-700 hover:text-primary-600">
                      Subjects
                    </Link>
                  </>
                )}
                <Link to="/about" className="text-base font-medium text-gray-700 hover:text-primary-600">
                  About
                </Link>
              </div>
            </div>
            <div className="ml-10 space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="text-base font-medium text-gray-700 hover:text-primary-600">
                    {user.username}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-block bg-primary-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-primary-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-base font-medium text-primary-600 hover:bg-gray-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-block bg-primary-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-primary-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="py-4 flex flex-wrap justify-center space-x-6 lg:hidden">
            <Link to="/" className="text-base font-medium text-gray-700 hover:text-primary-600">
              Home
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-base font-medium text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <Link to="/subjects" className="text-base font-medium text-gray-700 hover:text-primary-600">
                  Subjects
                </Link>
              </>
            )}
            <Link to="/about" className="text-base font-medium text-gray-700 hover:text-primary-600">
              About
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-500">&copy; 2025 EduAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
