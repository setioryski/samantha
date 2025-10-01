import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import CustomerModal from '../components/CustomerModal';
import ConfirmationModal from '../components/ConfirmationModal';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/customers');
            setCustomers(data);
        } catch (error) {
            showToast('Failed to load customers.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleOpenModal = (customer = null) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleOpenConfirm = (customer) => {
        setSelectedCustomer(customer);
        setIsConfirmOpen(true);
    };
    
    const handleCloseModals = () => {
        setIsModalOpen(false);
        setIsConfirmOpen(false);
        setSelectedCustomer(null);
    };

    const handleSaveCustomer = async (customerData) => {
        try {
            if (selectedCustomer) {
                await api.put(`/customers/${selectedCustomer._id}`, customerData);
                showToast('Customer updated successfully!', 'success');
            } else {
                await api.post('/customers', customerData);
                showToast('Customer created successfully!', 'success');
            }
            fetchCustomers();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save customer.', 'error');
        } finally {
            handleCloseModals();
        }
    };
    
    const handleDeleteCustomer = async () => {
        if (!selectedCustomer) return;
        try {
            await api.delete(`/customers/${selectedCustomer._id}`);
            showToast('Customer deleted successfully!', 'success');
            fetchCustomers();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete customer.', 'error');
        } finally {
            handleCloseModals();
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
    );

    if (loading) return <div>Loading customers...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
                <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Add Customer
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* Table Head */}
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map(customer => (
                            <tr key={customer._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal(customer)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleOpenConfirm(customer)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isModalOpen && <CustomerModal customer={selectedCustomer} onClose={handleCloseModals} onSave={handleSaveCustomer} />}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={handleCloseModals} onConfirm={handleDeleteCustomer} title="Delete Customer" message={`Are you sure you want to delete ${selectedCustomer?.name}?`} />}
        </div>
    );
};

export default CustomersPage;