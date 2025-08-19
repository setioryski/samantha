import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const { data } = await api.get('/expenses');
                setExpenses(data);
            } catch (error) {
                console.error("Failed to fetch expenses", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Record Expenses</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map(expense => (
                            <tr key={expense._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{expense.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap">Rp{expense.amount.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{expense.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpensesPage;