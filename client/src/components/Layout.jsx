import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext'; // Import useSettings
import Toast from './Toast';

const Layout = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings(); // Get settings
  const navigate = useNavigate();

  useEffect(() => {
    // Set document title from settings
    if (settings.companyName) {
      document.title = settings.companyName;
    }
  }, [settings.companyName]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const commonLinkClasses = "px-3 py-2 rounded-md text-sm font-medium";
  const activeLinkClasses = "bg-sky-700 text-white";
  const inactiveLinkClasses = "text-gray-500 hover:bg-gray-200 hover:text-gray-700";

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              {/* Use dynamic company name */}
              <span className="text-xl font-bold text-sky-800">{settings.companyName}</span>
              <div className="hidden md:flex items-center space-x-2">
                {user?.role === 'Admin' && (
                  <>
                    <NavLink to="/admin" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>Dashboard</NavLink>
                    <NavLink to="/pos" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>POS</NavLink>
                    <NavLink to="/admin/inventory" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>Inventory</NavLink>
                    <NavLink to="/admin/categories" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>Categories</NavLink>
                    <NavLink to="/admin/users" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>Users</NavLink>
                    <NavLink to="/admin/accounting" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>Accounting</NavLink>
                    <NavLink to="/admin/sales" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>Sales</NavLink>
                  </>
                )}
                {user?.role === 'Cashier' && (
                  <NavLink to="/pos" className={({isActive}) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>POS</NavLink>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, <span className="font-medium">{user?.username}</span> ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* The content of each page will be rendered here */}
          <Outlet />
        </div>
      </main>

      <Toast />
    </div>
  );
};

export default Layout;