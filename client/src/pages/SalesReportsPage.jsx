// client/src/pages/SalesReportsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import InvoiceModal from '../components/InvoiceModal';
import ConfirmationModal from '../components/ConfirmationModal'; // Import the new modal
import CheckoutModal from '../components/CheckoutModal';
import { useToast } from '../context/ToastContext';

const SalesReportsPage = () => {
    const [sales, setSales] = useState([]);
    const [therapists, setTherapists] = useState([]); // <-- State for therapists list
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [saleToRetractId, setSaleToRetractId] = useState(null);
    const [saleToPay, setSaleToPay] = useState(null);
    const [saleToDeleteId, setSaleToDeleteId] = useState(null);
    const { showToast } = useToast();

    // Filters State
    const [filterTherapistId, setFilterTherapistId] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
    const [filterStatus, setFilterStatus] = useState('');


    // Combined fetch function for sales and therapists
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (filterTherapistId) params.append('therapistId', filterTherapistId);
            if (filterStartDate) params.append('startDate', filterStartDate);
            if (filterEndDate) params.append('endDate', filterEndDate);
            if (filterPaymentStatus) params.append('paymentStatus', filterPaymentStatus);
            if (filterStatus) params.append('status', filterStatus);

            const [salesRes, therapistsRes] = await Promise.all([
                api.get(`/sales?${params.toString()}`), // Pass filters to sales API
                api.get('/therapists') // Fetch all therapists for the filter dropdown
            ]);
            setSales(salesRes.data);
            setTherapists(therapistsRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
            showToast('Failed to fetch sales reports or therapists.', 'error');
        } finally {
            setLoading(false);
        }
    // Include filter states in dependencies to refetch when they change
    }, [showToast, filterTherapistId, filterStartDate, filterEndDate, filterPaymentStatus, filterStatus]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // fetchData already includes filter dependencies


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

    // Opens the confirmation modal for retraction
    const handleRetractClick = (saleId) => {
        setSaleToRetractId(saleId);
        setIsConfirmModalOpen(true);
    };

    // Opens the confirmation modal for deletion
    const handleDeleteClick = (saleId) => {
        setSaleToDeleteId(saleId);
        setIsConfirmModalOpen(true); // Re-use the same confirmation modal state variable
    };

    // Opens the checkout modal for paying an unpaid order
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
            fetchData(); // Refresh the sales list
        } catch (error) {
            console.error("Failed to retract sale", error);
            showToast(error.response?.data?.message || 'Failed to retract sale.', 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setSaleToRetractId(null);
        }
    };

    // The actual deletion logic, called when confirm is clicked in the modal
    const confirmDeletion = async () => {
        if (!saleToDeleteId) return;
        try {
            await api.delete(`/sales/${saleToDeleteId}`);
            showToast('Sale deleted successfully!', 'success');
            fetchData(); // Refresh the sales list
        } catch (error) {
            console.error("Failed to delete sale", error);
            showToast(error.response?.data?.message || 'Failed to delete sale.', 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setSaleToDeleteId(null);
        }
    };

    // Handles payment confirmation from the checkout modal (for unpaid orders)
    const handleConfirmCheckout = async (paymentMethod) => {
        if (!saleToPay) return;
        try {
            await api.put(`/sales/${saleToPay._id}/pay`, { paymentMethod });
            showToast('Payment successful!', 'success');
            fetchData(); // Refresh the sales list
            const { data } = await api.get(`/sales/${saleToPay._id}`); // Fetch updated sale to show invoice
            setSelectedSale(data); // Set the newly paid sale for the invoice
            setIsInvoiceModalOpen(true); // Open the invoice modal
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

                {/* Filters Section */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                     <div>
                        <label htmlFor="filterTherapist" className="block text-xs font-medium text-gray-500">Therapist</label>
                        <select
                            id="filterTherapist"
                            value={filterTherapistId}
                            onChange={e => setFilterTherapistId(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md text-sm"
                        >
                            <option value="">All Therapists</option>
                            {therapists.map(t => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="filterStartDate" className="block text-xs font-medium text-gray-500">Start Date</label>
                        <input
                            type="date"
                            id="filterStartDate"
                            value={filterStartDate}
                            onChange={e => setFilterStartDate(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="filterEndDate" className="block text-xs font-medium text-gray-500">End Date</label>
                        <input
                            type="date"
                            id="filterEndDate"
                            value={filterEndDate}
                            onChange={e => setFilterEndDate(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="filterPaymentStatus" className="block text-xs font-medium text-gray-500">Payment</label>
                        <select
                            id="filterPaymentStatus"
                            value={filterPaymentStatus}
                            onChange={e => setFilterPaymentStatus(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md text-sm"
                        >
                            <option value="">All</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filterStatus" className="block text-xs font-medium text-gray-500">Status</label>
                        <select
                            id="filterStatus"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md text-sm"
                        >
                            <option value="">All</option>
                            <option value="Completed">Completed</option>
                            <option value="Retracted">Retracted</option>
                        </select>
                    </div>
                    {/* Optionally add a button to apply filters if you don't want it to filter on every change */}
                    {/* <button onClick={fetchData} className="bg-blue-500 text-white p-2 rounded-md">Apply Filters</button> */}
                </div>


                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th> {/* <-- Added Therapist Header */}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.therapistId?.name || 'N/A'}</td> {/* <-- Display Therapist Name */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <ul className="list-disc list-inside">
                                            {sale.items.map(item => (
                                                // Ensure a unique key if _id isn't always present on items from old data
                                                <li key={item._id || `${item.productId}-${item.name}`}>{item.quantity}x {item.name}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rp{sale.totalAmount.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.paymentMethod}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPaymentStatusBadge(sale.paymentStatus)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(sale.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                         {/* Pay button only if Unpaid and Completed */}
                                        {sale.paymentStatus === 'Unpaid' && sale.status === 'Completed' && (
                                            <button
                                                onClick={() => handlePayClick(sale)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        {/* Invoice button always available */}
                                        <button
                                            onClick={() => handlePrintClick(sale._id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Invoice
                                        </button>
                                        {/* Retract button only if Completed */}
                                        {sale.status === 'Completed' ? (
                                        <button
                                            onClick={() => handleRetractClick(sale._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Retract
                                        </button>
                                        /* Delete button only if Retracted */
                                        ) : sale.status === 'Retracted' ? (
                                        <button
                                            onClick={() => handleDeleteClick(sale._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                        ) : null} {/* Render nothing if status is neither */}
                                    </td>
                                </tr>
                            ))}
                             {/* Display message if no sales match filters */}
                            {sales.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="10" className="text-center py-4 text-gray-500">
                                        No sales found matching the criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Modal */}
            {isInvoiceModalOpen && (
                <InvoiceModal
                    sale={selectedSale}
                    onClose={() => setIsInvoiceModalOpen(false)}
                />
            )}

            {/* Checkout Modal (for paying unpaid orders) */}
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

            {/* Confirmation Modal for Retraction */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen && !!saleToRetractId}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setSaleToRetractId(null);
                }}
                onConfirm={confirmRetraction}
                title="Confirm Sale Retraction"
                message="Are you sure you want to retract this sale? This action cannot be undone and will restore the items to inventory."
            />

            {/* Confirmation Modal for Deletion */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen && !!saleToDeleteId}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setSaleToDeleteId(null);
                }}
                onConfirm={confirmDeletion}
                title="Confirm Sale Deletion"
                message="Are you sure you want to permanently delete this sale? This action cannot be undone."
            />
        </>
    );
};

export default SalesReportsPage;