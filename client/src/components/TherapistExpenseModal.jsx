// client/src/components/TherapistExpenseModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

// Helper function to format a date to YYYY-MM-DD string
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TherapistExpenseModal = ({ therapist, onClose }) => {
    const { showToast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);

    // Form state for new expense
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [expenseDate, setExpenseDate] = useState(formatDate(new Date())); // Default to today

    // Filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchExpenses = useCallback(async () => {
        if (!therapist?._id) return;
        setLoadingExpenses(true);
        try {
            const params = new URLSearchParams();
            params.append('therapistId', therapist._id);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const { data } = await api.get(`/expenses?${params.toString()}`);
            setExpenses(data);
        } catch (error) {
            showToast('Failed to load expense history.', 'error');
            console.error("Fetch Expense Error:", error);
        } finally {
            setLoadingExpenses(false);
        }
    }, [therapist?._id, startDate, endDate, showToast]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]); // Refetch when filters or therapist change

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!description || !amount || !category) {
            showToast('Please fill in all expense fields.', 'error');
            return;
        }
        try {
            const newExpense = {
                description,
                amount: Number(amount),
                category,
                date: expenseDate,
                therapistId: therapist._id, // Link to the current therapist
            };
            await api.post('/expenses', newExpense);
            showToast('Expense added successfully!', 'success');
            // Reset form and refresh list
            setDescription('');
            setAmount('');
            setCategory('');
            setExpenseDate(formatDate(new Date()));
            fetchExpenses(); // Refresh the history
        } catch (error) {
            console.error("Failed to add expense", error);
            showToast(error.response?.data?.message || 'Failed to add expense.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Expenses for {therapist?.name}</h2>

                {/* Add Expense Form */}
                <div className="mb-6 border-b pb-4">
                     <h3 className="text-lg font-semibold mb-3">Add New Expense</h3>
                     <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                         <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                         <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                             placeholder="Amount (Rp)"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                         <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Category (e.g., Supplies)"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                         <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                        <button
                            type="submit"
                            className="md:col-span-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                        >
                            Add Expense
                        </button>
                     </form>
                </div>

                {/* Expense History & Filters */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Expense History</h3>
                     <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                             className="p-2 border rounded-md text-sm w-full sm:w-auto"
                             placeholder="Start Date"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border rounded-md text-sm w-full sm:w-auto"
                            placeholder="End Date"
                        />
                         {/* Filter button removed - filtering happens on date change via useEffect */}
                    </div>

                    <div className="overflow-y-auto max-h-60 border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loadingExpenses ? (
                                    <tr><td colSpan="4" className="text-center py-4 text-gray-500">Loading...</td></tr>
                                ) : expenses.length === 0 ? (
                                     <tr><td colSpan="4" className="text-center py-4 text-gray-500">No expenses found for this period.</td></tr>
                                ) : (
                                    expenses.map(expense => (
                                        <tr key={expense._id}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(expense.date)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">{expense.description}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">{expense.category}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-red-600 font-semibold">
                                                Rp{expense.amount.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TherapistExpenseModal;