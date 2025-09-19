import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import InventoryPage from './pages/InventoryPage';
import UsersPage from './pages/UsersPage';
import AccountingPage from './pages/AccountingPage';
import SalesReportsPage from './pages/SalesReportsPage';
import CategoryPage from './pages/CategoryPage';
import SettingsPage from './pages/SettingsPage';
import CustomersPage from './pages/CustomersPage';
import AllSellingProductsPage from './pages/AllSellingProductsPage';
import VouchersPage from './pages/VouchersPage';
import TherapistsPage from './pages/TherapistsPage'; // <-- Import this

const App = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
            
            <Route element={<Layout />}>
                <Route path="/" element={
                    <ProtectedRoute>
                        {user?.role === 'Admin' ? <Navigate to="/admin" /> : <Navigate to="/pos" />}
                    </ProtectedRoute>
                } />

                <Route path="/pos" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
                        <POSPage />
                    </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin/inventory" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <InventoryPage />
                    </ProtectedRoute>
                } />
                 <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <UsersPage />
                    </ProtectedRoute>
                } />
                 <Route path="/admin/accounting" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <AccountingPage />
                    </ProtectedRoute>
                } />
                 <Route path="/admin/sales" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <SalesReportsPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <CategoryPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/vouchers" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <VouchersPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/therapists" element={ // <-- Add this route
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <TherapistsPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <SettingsPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/customers" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <CustomersPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/reports/all-selling" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <AllSellingProductsPage />
                    </ProtectedRoute>
                } />
            </Route>
            
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
    );
}

export default App;