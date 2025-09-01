import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import InvoiceModal from '../components/InvoiceModal';
import ConfirmationModal from '../components/ConfirmationModal'; // Import the new modal
import CheckoutModal from '../components/CheckoutModal';
import { useToast } from '../context/ToastContext';

const SalesReportsPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [saleToRetractId, setSaleToRetractId] = useState(null);
    const [saleToPay, setSaleToPay] = useState(null);
    const { showToast } = useToast();

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sales');
            setSales(data);
        } catch (error) {
            console.error("Failed to fetch sales", error);
            showToast('Failed to fetch sales reports.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const handlePrintClick = async (saleId) => {
        try {
            const { data } = await api.get(`/sales/${saleId}`);
            setSelectedSale(data);
            setIsInvoiceModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch sale details", error);
            showToast('Failed to fetch sale details.', 'error');
        }
    };
    
    // Opens the confirmation modal
    const handleRetractClick = (saleId) => {
        setSaleToRetractId(saleId);
        setIsConfirmModalOpen(true);
    };

    const handlePayClick = (sale) => {
        setSaleToPay(sale);
        setIsCheckoutModalOpen(true);
    };

    // The actual retract logic, called when confirm is clicked in the modal
    const confirmRetraction = async () => {
        if (!saleToRetractId) return;
        try {
            await api.put(`/sales/${saleToRetractId}/retract`);
            showToast('Sale retracted successfully!', 'success');
            fetchSales(); // Refresh the sales list
        } catch (error) {
            console.error("Failed to retract sale", error);
            showToast(error.response?.data?.message || 'Failed to retract sale.', 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setSaleToRetractId(null);
        }
    };

    const handleConfirmCheckout = async (paymentMethod) => {
        if (!saleToPay) return;
        try {
            await api.put(`/sales/${saleToPay._id}/pay`, { paymentMethod });
            showToast('Payment successful!', 'success');
            fetchSales(); // Refresh the sales list
            const { data } = await api.get(`/sales/${saleToPay._id}`);
            setSelectedSale(data);
            setIsInvoiceModalOpen(true);
        } catch (error) {
            showToast(error.response?.data?.message || 'Payment failed.', 'error');
        } finally {
            setIsCheckoutModalOpen(false);
            setSaleToPay(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
            case 'Retracted':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Retracted</span>;
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const getPaymentStatusBadge = (status) => {
        switch (status) {
            case 'Paid':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>;
            case 'Unpaid':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Unpaid</span>;
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (loading) return <div>Loading sales reports...</div>;

    return (
        <>
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Sales Reports</h1>
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sales.map(sale => (
                                <tr key={sale._id} className={sale.status === 'Retracted' ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.cashierId.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.customerId?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <ul className="list-disc list-inside">
                                            {sale.items.map(item => (
                                                <li key={item._id}>{item.quantity}x {item.name}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rp{sale.totalAmount.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.paymentMethod}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPaymentStatusBadge(sale.paymentStatus)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(sale.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        {sale.paymentStatus === 'Unpaid' && sale.status === 'Completed' && (
                                            <button
                                                onClick={() => handlePayClick(sale)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handlePrintClick(sale._id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Invoice
                                        </button>
                                        <button
                                            onClick={() => handleRetractClick(sale._id)}
                                            disabled={sale.status === 'Retracted'}
                                            className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                        >
                                            Retract
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isInvoiceModalOpen && (
                <InvoiceModal
                    sale={selectedSale}
                    onClose={() => setIsInvoiceModalOpen(false)}
                />
            )}

            {isCheckoutModalOpen && (
                <CheckoutModal
                    totalAmount={saleToPay ? saleToPay.totalAmount : 0}
                    onClose={() => {
                        setIsCheckoutModalOpen(false);
                        setSaleToPay(null);
                    }}
                    onConfirm={handleConfirmCheckout}
                />
            )}

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setSaleToRetractId(null);
                }}
                onConfirm={confirmRetraction}
                title="Confirm Sale Retraction"
                message="Are you sure you want to retract this sale? This action cannot be undone and will restore the items to inventory."
            />
        </>
    );
};

export default SalesReportsPage;