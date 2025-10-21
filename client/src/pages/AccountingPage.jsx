// client/src/pages/AccountingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AccountingPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const { showToast } = useToast();

    // Form state for new expense
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState(null);

    // State for date filtering
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // State for category filtering (optional, can be added later)
    // const [filterCategory, setFilterCategory] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Build query parameters for expenses based on filters
            const expenseParams = new URLSearchParams();
            if (startDate) expenseParams.append('startDate', startDate);
            if (endDate) expenseParams.append('endDate', endDate);
            // if (filterCategory) expenseParams.append('category', filterCategory); // Uncomment to add category filter

            // Build query parameters for sales based on filters
            const saleParams = new URLSearchParams();
            if (startDate) saleParams.append('startDate', startDate);
            if (endDate) saleParams.append('endDate', endDate);
            // Add other relevant sales filters if needed (e.g., paymentStatus='Paid')
            saleParams.append('paymentStatus', 'Paid');
            saleParams.append('status', 'Completed');


            const [expensesRes, salesRes] = await Promise.all([
                api.get(`/expenses?${expenseParams.toString()}`),
                api.get(`/sales?${saleParams.toString()}`) // Fetch only completed, paid sales matching date range
            ]);
            setExpenses(expensesRes.data);
            setSales(salesRes.data); // Already filtered by backend
        } catch (error) {
            console.error("Failed to fetch accounting data", error);
            showToast('Failed to load accounting data.', 'error');
        } finally {
            setLoading(false);
        }
    // Update dependencies to refetch when filters change
    }, [showToast, startDate, endDate /*, filterCategory*/]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // fetchData now includes filter dependencies

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!description || !amount || !category) {
            showToast('Please fill in all fields.', 'error');
            return;
        }
        try {
            // Note: Adding expense here won't link to a therapist unless you add a therapist selector
            const newExpense = { description, amount: Number(amount), category };
            await api.post('/expenses', newExpense);
            showToast('Expense added successfully!', 'success');
            // Reset form and refresh list
            setDescription('');
            setAmount('');
            setCategory('');
            fetchData(); // Refresh data including new expense
        } catch (error) {
            console.error("Failed to add expense", error);
            showToast(error.response?.data?.message || 'Failed to add expense.', 'error');
        }
    };

    const handleDeleteClick = (expenseId) => {
        setExpenseToDeleteId(expenseId);
        setIsConfirmModalOpen(true);
    };

    const confirmDeletion = async () => {
        if (!expenseToDeleteId) return;
        try {
            await api.delete(`/expenses/${expenseToDeleteId}`);
            showToast('Expense deleted successfully!', 'success');
            fetchData(); // Refresh the data
        } catch (error) {
            console.error("Failed to delete expense", error);
             // Check specific error message from backend
            if (error.response?.status === 400 && error.response?.data?.message) {
                 showToast(error.response.data.message, 'error');
            } else {
                 showToast('Failed to delete expense.', 'error');
            }
        } finally {
            setIsConfirmModalOpen(false);
            setExpenseToDeleteId(null);
        }
    };

    // Corrected Calculations only use state variables (filteredSales === sales now)
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalCOGS = sales.reduce((acc, sale) =>
        acc + sale.items.reduce((itemAcc, item) => itemAcc + ((item.basePrice || 0) * item.quantity), 0),
    0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const netIncome = grossProfit - totalExpenses;


    const handleExport = () => {
        setExporting(true);

        // Use a timeout to allow the UI to update to "Exporting..."
        setTimeout(() => {
            try {
                const wb = XLSX.utils.book_new();

                // Summary Sheet
                const summaryData = [
                    ["Financial Summary", ""],
                    ["Date Range", `${startDate || 'Start'} to ${endDate || 'End'}`],
                    ["", ""], // Spacer
                    ["Total Revenue (Paid Sales)", totalRevenue],
                    ["Cost of Goods Sold (COGS)", totalCOGS],
                    ["Gross Profit", grossProfit],
                    ["Total Expenses", totalExpenses],
                    ["Net Income", netIncome],
                ];
                const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
                // Adjust column widths for Summary
                 summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
                XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

                // Sales Sheet (Already filtered paid/completed sales)
                const salesData = sales.map(sale => ({
                    Date: new Date(sale.createdAt).toLocaleString('id-ID'),
                    Cashier: sale.cashierId.username,
                    Customer: sale.customerId?.name || 'Walk-in',
                    Therapist: sale.therapistId?.name || 'N/A',
                    Items: sale.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
                    Amount: sale.totalAmount,
                    PaymentMethod: sale.paymentMethod,
                }));
                const salesWs = XLSX.utils.json_to_sheet(salesData);
                 // Adjust column widths for Sales
                 salesWs['!cols'] = [ { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
                XLSX.utils.book_append_sheet(wb, salesWs, "Income from Sales");

                // Expenses Sheet (using filtered expenses)
                const expensesData = expenses.map(exp => ({
                    Date: new Date(exp.date).toLocaleDateString('id-ID'),
                    Description: exp.description,
                    Category: exp.category,
                    Therapist: exp.therapistId?.name || '', // Add Therapist Name
                    Amount: exp.amount,
                    EnteredBy: exp.createdBy?.username || 'N/A'
                }));
                const expensesWs = XLSX.utils.json_to_sheet(expensesData);
                 // Adjust column widths for Expenses
                 expensesWs['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
                XLSX.utils.book_append_sheet(wb, expensesWs, "Expenses");

                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const fileName = `Accounting_Report_${startDate || 'start'}_to_${endDate || 'end'}.xlsx`;
                saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);

            } catch (error) {
                 console.error("Export Error:", error);
                 showToast("Failed to export data to Excel.", "error");
            } finally {
                setExporting(false);
            }
        }, 100); // Short delay for UI update
    };


    if (loading) return <div>Loading accounting data...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
              <h1 className="text-2xl font-bold text-gray-800">Accounting</h1>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="p-2 border rounded-md text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="p-2 border rounded-md text-sm"
                    />
                </div>
                 {/* Optional: Add Category Filter Dropdown if needed */}
                {/* <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="p-2 border rounded-md text-sm">
                    <option value="">All Categories</option>
                    {[...new Set(expenses.map(e => e.category))].sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select> */}
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto disabled:bg-gray-400"
                >
                  {exporting ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-green-100 p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
                    <p className="text-2xl font-semibold text-green-900">Rp{totalRevenue.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-yellow-800">Cost of Goods Sold</h3>
                    <p className="text-2xl font-semibold text-yellow-900">Rp{totalCOGS.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-red-800">Operating Expenses</h3>
                    <p className="text-2xl font-semibold text-red-900">Rp{totalExpenses.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-sky-100 p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-sky-800">Net Income</h3>
                    <p className="text-2xl font-semibold text-sky-900">Rp{netIncome.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Income (Sales List) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Income from Sales (Paid & Completed)</h2>
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sales.map(sale => (
                                    <tr key={sale._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-normal text-sm">{sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.therapistId?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">Rp{sale.totalAmount.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                                {sales.length === 0 && (
                                     <tr><td colSpan="4" className="text-center py-4 text-gray-500">No paid sales found for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Add Expense Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                        <h2 className="text-lg font-semibold mb-4">Add Manual Expense</h2>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <input
                                    type="text"
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (Rp)</label>
                                <input
                                    type="number"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                                <input
                                    type="text"
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="e.g., Utilities, Supplies"
                                    className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                            >
                                Add Expense
                            </button>
                        </form>
                    </div>

                    {/* Expenses List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-lg font-semibold mb-4">Expense History</h2>
                        <div className="overflow-y-auto max-h-96">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        {/* ADDED Therapist Column Header */}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc / Therapist</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {expenses.map(expense => (
                                        <tr key={expense._id}>
                                            <td className="px-4 py-4 whitespace-normal">
                                                <div className="text-sm text-gray-900">{expense.description}</div>
                                                {/* Display Therapist Name if available */}
                                                {expense.therapistId?.name && (
                                                    <div className="text-xs text-blue-600">({expense.therapistId.name})</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">Rp{expense.amount.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {/* Prevent deletion of automatic expenses */}
                                                {!(expense.category === 'Therapist Fee' || expense.category === 'Transportation' || expense.category === 'Stock Loss') || !expense.description.includes('Sale ID:') ? (
                                                    <button
                                                        onClick={() => handleDeleteClick(expense._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                ) : (
                                                     <span className="text-xs text-gray-400 italic">Auto</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                         <tr><td colSpan="5" className="text-center py-4 text-gray-500">No expenses found for this period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setExpenseToDeleteId(null);
                }}
                onConfirm={confirmDeletion}
                title="Confirm Expense Deletion"
                message="Are you sure you want to delete this expense? This action cannot be undone."
            />
        </div>
    );
};

export default AccountingPage;