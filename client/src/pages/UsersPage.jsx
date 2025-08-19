// client/src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import UserModal from '../components/UserModal'; 
import ConfirmationModal from '../components/ConfirmationModal'; 

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            showToast('Failed to load users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenUserModal = (user = null) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleOpenConfirmModal = (user) => {
        setSelectedUser(user);
        setIsConfirmModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsUserModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedUser(null);
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser && selectedUser._id) {
                // Update existing user
                await api.put(`/users/${selectedUser._id}`, userData);
                showToast('User updated successfully!', 'success');
            } else {
                // Create new user via the specific register route on userRoutes
                await api.post('/users', userData);
                showToast('User created successfully!', 'success');
            }
            fetchUsers();
        } catch (error) {
            console.error("Failed to save user", error);
            showToast(error.response?.data?.message || 'Failed to save user.', 'error');
        } finally {
            handleCloseModals();
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await api.delete(`/users/${selectedUser._id}`);
            showToast('User deleted successfully!', 'success');
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user", error);
            showToast(error.response?.data?.message || 'Failed to delete user.', 'error');
        } finally {
            handleCloseModals();
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <button
                    onClick={() => handleOpenUserModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Add New User
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleOpenUserModal(user)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleOpenConfirmModal(user)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isUserModalOpen && (
                <UserModal
                    user={selectedUser}
                    onClose={handleCloseModals}
                    onSave={handleSaveUser}
                />
            )}

            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteUser}
                    title="Confirm User Deletion"
                    message={`Are you sure you want to delete the user "${selectedUser?.username}"? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default UsersPage;