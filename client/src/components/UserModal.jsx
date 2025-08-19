// client/src/components/UserModal.jsx
import React, { useState, useEffect } from 'react';

const UserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'Cashier'
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                password: '', // Password is not pre-filled for security
                role: user.role
            });
        } else {
            // Reset for new user
            setFormData({
                username: '',
                password: '',
                role: 'Cashier'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        // If password is not entered during edit, don't send it
        if (user && !dataToSave.password) {
            delete dataToSave.password;
        }
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{user ? 'Edit User' : 'Add New User'}</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password {user ? '(Leave blank to keep unchanged)' : ''}
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required={!user} // Password is required for new users
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            name="role"
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option>Cashier</option>
                            <option>Admin</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Save User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;