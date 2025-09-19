import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const DashboardCard = ({ to, title, description, icon }) => (
  <Link to={to} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
    <div className="flex items-center space-x-4">
      <div className="text-3xl text-sky-600">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  </Link>
);


const AdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [settings, setSettings] = useState({ expiringSoonDays: 30 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [expiringRes, topProductsRes, settingsRes] = await Promise.all([
        api.get('/products/expiring-soon'),
        api.get('/sales/topproducts'),
        api.get('/settings')
      ]);

      setExpiringProducts(expiringRes.data);
      setTopProducts(topProductsRes.data);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      showToast('Could not load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{greeting}, {user.username}!</h1>
      <p className="text-gray-600 mb-6">Here's what's happening today. The current time is {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard to="/pos" title="POS Terminal" description="Start a new sale transaction." icon="💰" />
        <DashboardCard to="/admin/inventory" title="Manage Inventory" description="Add, edit, and track products." icon="📦" />
        <DashboardCard to="/admin/sales" title="Sales Reports" description="View daily and monthly reports." icon="📊" />
        <DashboardCard to="/admin/reports/all-selling" title="All Selling Products" description="View all products sold." icon="📈" />
        <DashboardCard to="/admin/users" title="Manage Users" description="Add or edit cashier accounts." icon="👥" />
        <DashboardCard to="/admin/accounting" title="Accounting" description="Track income & expenses." icon="🧾" />
        <DashboardCard to="/admin/categories" title="Manage Categories" description="Add or edit product categories." icon="🏷️" />
        <DashboardCard to="/admin/vouchers" title="Vouchers" description="Manage discounts and vouchers." icon="🎟️" />
        <DashboardCard to="/admin/therapists" title="Therapists" description="Manage therapist data." icon="💆" />
        <DashboardCard to="/admin/settings" title="Settings" description="Manage store information." icon="⚙️" />
        <DashboardCard to="/admin/customers" title="Manage Customers" description="View and manage customer data." icon="🧑" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Top Selling Products Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Selling Products</h2>
          {loading ? (
              <p>Loading top products...</p>
          ) : topProducts.length > 0 ? (
            <>
              {/* Mobile List View */}
              <div className="md:hidden">
                  <ul className="divide-y divide-gray-200">
                      {topProducts.map(product => (
                          <li key={product._id} className="py-3 flex justify-between items-center">
                              <span className="text-sm text-gray-700">{product.name}</span>
                              <span className="text-sm font-medium text-gray-900">{product.totalQuantity} sold</span>
                          </li>
                      ))}
                  </ul>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {topProducts.map(product => (
                              <tr key={product._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{product.totalQuantity}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </>
          ) : (
              <p className="text-gray-500">No sales data available yet.</p>
          )}
        </div>
        
        {/* Expiring Products Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Products Expiring Soon (Next {settings.expiringSoonDays} Days)</h2>
          {loading ? (
              <p>Loading expiring products...</p>
          ) : expiringProducts.length > 0 ? (
              <div className="overflow-auto max-h-60">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                          <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {expiringProducts.map(product => (
                              <tr key={product._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                                      {new Date(product.expiryDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          ) : (
              <p className="text-gray-500">No products are expiring in the next {settings.expiringSoonDays} days.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;