import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const AllSellingProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchAllSellingProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sales/allselling');
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch all selling products", error);
            showToast('Could not load the report.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchAllSellingProducts();
    }, [fetchAllSellingProducts]);

    if (loading) return <div>Loading report...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">All Selling Products Report</h1>
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity Sold</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.totalQuantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AllSellingProductsPage;