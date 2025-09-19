import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import VoucherModal from '../components/VoucherModal';
import ConfirmationModal from '../components/ConfirmationModal';

const VouchersPage = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/vouchers');
            setVouchers(data);
        } catch (error) {
            showToast('Failed to load vouchers.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const handleOpenModal = (voucher = null) => {
        setSelectedVoucher(voucher);
        setIsModalOpen(true);
    };

    const handleOpenConfirm = (voucher) => {
        setSelectedVoucher(voucher);
        setIsConfirmOpen(true);
    };
    
    const handleCloseModals = () => {
        setIsModalOpen(false);
        setIsConfirmOpen(false);
        setSelectedVoucher(null);
    };

    const handleSaveVoucher = async (voucherData) => {
        try {
            if (selectedVoucher) {
                await api.put(`/vouchers/${selectedVoucher._id}`, voucherData);
                showToast('Voucher updated successfully!', 'success');
            } else {
                await api.post('/vouchers', voucherData);
                showToast('Voucher created successfully!', 'success');
            }
            fetchVouchers();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save voucher.', 'error');
        } finally {
            handleCloseModals();
        }
    };
    
    const handleDeleteVoucher = async () => {
        if (!selectedVoucher) return;
        try {
            await api.delete(`/vouchers/${selectedVoucher._id}`);
            showToast('Voucher deleted successfully!', 'success');
            fetchVouchers();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete voucher.', 'error');
        } finally {
            handleCloseModals();
        }
    };
    
    const handleToggleActive = async (voucher) => {
        try {
            await api.put(`/vouchers/${voucher._id}`, { ...voucher, isActive: !voucher.isActive });
            showToast(`Voucher ${!voucher.isActive ? 'activated' : 'deactivated'}.`, 'success');
            fetchVouchers();
        } catch (error) {
            showToast('Failed to toggle voucher status.', 'error');
        }
    };

    if (loading) return <div>Loading vouchers...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Voucher & Discount Management</h1>
                <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Add Voucher
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {vouchers.map(voucher => (
                            <tr key={voucher._id}>
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{voucher.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{voucher.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap capitalize">{voucher.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {voucher.type === 'percentage' ? `${voucher.value}%` : `Rp${voucher.value.toLocaleString('id-ID')}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button onClick={() => handleToggleActive(voucher)} className={`px-2 py-1 text-xs rounded-full ${voucher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {voucher.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal(voucher)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleOpenConfirm(voucher)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isModalOpen && <VoucherModal voucher={selectedVoucher} onClose={handleCloseModals} onSave={handleSaveVoucher} />}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={handleCloseModals} onConfirm={handleDeleteVoucher} title="Delete Voucher" message={`Are you sure you want to delete the voucher ${selectedVoucher?.code}?`} />}
        </div>
    );
};

export default VouchersPage;