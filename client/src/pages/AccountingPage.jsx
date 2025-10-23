// client/src/pages/AccountingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import ExpenseModal from '../components/ExpenseModal'; // Import the new modal
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AccountingPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const { showToast } = useToast();

    // Modal states
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); // State for the new expense modal

    // State for date filtering
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // const [filterCategory, setFilterCategory] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Build query parameters for expenses based on filters
            const expenseParams = new URLSearchParams();
            if (startDate) expenseParams.append('startDate', startDate);
            if (endDate) expenseParams.append('endDate', endDate);
            // if (filterCategory) expenseParams.append('category', filterCategory);

            // Build query parameters for sales based on filters
            const saleParams = new URLSearchParams();
            if (startDate) saleParams.append('startDate', startDate);
            if (endDate) saleParams.append('endDate', endDate);
            saleParams.append('paymentStatus', 'Paid');
            saleParams.append('status', 'Completed');

            const [expensesRes, salesRes] = await Promise.all([
                api.get(`/expenses?${expenseParams.toString()}`),
                api.get(`/sales?${saleParams.toString()}`)
            ]);
            setExpenses(expensesRes.data);
            setSales(salesRes.data);
        } catch (error) {
            console.error("Failed to fetch accounting data", error);
            showToast('Failed to load accounting data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast, startDate, endDate /*, filterCategory*/]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveExpense = async (expenseData) => {
        try {
            await api.post('/expenses', expenseData);
            showToast('Expense added successfully!', 'success');
            setIsExpenseModalOpen(false);
            fetchData();
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
            fetchData();
        } catch (error) {
            console.error("Failed to delete expense", error);
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

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalCOGS = sales.reduce((acc, sale) =>
        acc + sale.items.reduce((itemAcc, item) => itemAcc + ((item.basePrice || 0) * item.quantity), 0),
    0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const netIncome = grossProfit - totalExpenses;

    // --- ADJUSTED handleExport ---
    const handleExport = () => {
        setExporting(true);
        setTimeout(() => {
            try {
                const wb = XLSX.utils.book_new();

                // Summary Sheet - Export numbers directly
                const summaryData = [
                    ["Financial Summary", ""],
                    ["Date Range", `${startDate || 'Start'} to ${endDate || 'End'}`],
                    ["", ""], // Spacer
                    ["Total Revenue (Paid Sales)", totalRevenue], // Number
                    ["Cost of Goods Sold (COGS)", totalCOGS],      // Number
                    ["Gross Profit", grossProfit],                // Number
                    ["Total Expenses", totalExpenses],            // Number
                    ["Net Income", netIncome],                    // Number
                ];
                const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
                 // Apply number format to currency cells in Summary
                summaryWs['B4'].t = 'n'; // Total Revenue
                summaryWs['B4'].z = '"Rp"#,##0';
                summaryWs['B5'].t = 'n'; // COGS
                summaryWs['B5'].z = '"Rp"#,##0';
                summaryWs['B6'].t = 'n'; // Gross Profit
                summaryWs['B6'].z = '"Rp"#,##0';
                summaryWs['B7'].t = 'n'; // Total Expenses
                summaryWs['B7'].z = '"Rp"#,##0';
                summaryWs['B8'].t = 'n'; // Net Income
                summaryWs['B8'].z = '"Rp"#,##0';
                summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
                XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

                // Sales Sheet - Export Date objects and numbers
                const salesData = sales.map(sale => ({
                    Date: new Date(sale.createdAt), // Date object
                    Cashier: sale.cashierId.username,
                    Customer: sale.customerId?.name || 'Walk-in',
                    Therapist: sale.therapistId?.name || 'N/A',
                    Items: sale.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
                    Amount: sale.totalAmount, // Number
                    PaymentMethod: sale.paymentMethod,
                }));
                const salesWs = XLSX.utils.json_to_sheet(salesData, { cellDates: true }); // Use cellDates: true
                 salesWs['!cols'] = [ { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
                 // Apply currency format to Amount column (assuming it's column F, index 5)
                 // Need to iterate through rows if json_to_sheet doesn't apply format automatically
                const range = XLSX.utils.decode_range(salesWs['!ref']);
                for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Start from row 1 (0 is header)
                    const cell_address = { c: 5, r: R }; // Column F
                    const cell_ref = XLSX.utils.encode_cell(cell_address);
                    if(salesWs[cell_ref]) {
                        salesWs[cell_ref].t = 'n';
                        salesWs[cell_ref].z = '"Rp"#,##0';
                    }
                }
                XLSX.utils.book_append_sheet(wb, salesWs, "Income from Sales");

                // Expenses Sheet - Export Date objects and numbers
                const expensesData = expenses.map(exp => ({
                    Date: new Date(exp.date), // Date object
                    Description: exp.description,
                    Category: exp.category,
                    Therapist: exp.therapistId?.name || '',
                    Amount: exp.amount, // Number
                    EnteredBy: exp.createdBy?.username || 'N/A'
                }));
                const expensesWs = XLSX.utils.json_to_sheet(expensesData, { cellDates: true }); // Use cellDates: true
                 expensesWs['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
                 // Apply currency format to Amount column (assuming it's column E, index 4)
                const expRange = XLSX.utils.decode_range(expensesWs['!ref']);
                for (let R = expRange.s.r + 1; R <= expRange.e.r; ++R) { // Start from row 1
                    const cell_address = { c: 4, r: R }; // Column E
                    const cell_ref = XLSX.utils.encode_cell(cell_address);
                    if(expensesWs[cell_ref]) {
                        expensesWs[cell_ref].t = 'n';
                        expensesWs[cell_ref].z = '"Rp"#,##0';
                    }
                }
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
        }, 100);
    };
    // --- END ADJUSTED handleExport ---

    if (loading) return <div>Loading accounting data...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
              <h1 className="text-2xl font-bold text-gray-800">Accounting</h1>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Date Filters */}
                <div className="flex items-center gap-2">
                    <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded-md text-sm"/>
                    <span className="text-gray-500">-</span>
                    <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded-md text-sm"/>
                </div>
                {/* Add Expense Button */}
                <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                >
                    Add Manual Expense
                </button>
                {/* Export Button */}
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

             {/* Layout: Income Table then Expense Table */}
             <div className="space-y-8">
                 {/* Income (Sales List) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Income from Sales (Paid & Completed)</h2>
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {sales.map(sale => (
                                    <tr key={sale._id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 whitespace-normal text-sm">{sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">{sale.therapistId?.name || 'N/A'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">Rp{sale.totalAmount.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                                {sales.length === 0 && (
                                     <tr><td colSpan="4" className="text-center py-4 text-gray-500">No paid sales found for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                 {/* Expenses List */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Expense History</h2>
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.map(expense => (
                                    <tr key={expense._id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 whitespace-normal text-sm text-gray-900">{expense.description}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600">{expense.therapistId?.name || ''}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">Rp{expense.amount.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                                     <tr><td colSpan="6" className="text-center py-4 text-gray-500">No expenses found for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>

            {/* Modals */}
            {isExpenseModalOpen && (
                <ExpenseModal
                    onClose={() => setIsExpenseModalOpen(false)}
                    onSave={handleSaveExpense}
                />
            )}

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