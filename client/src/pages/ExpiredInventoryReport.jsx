import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ExpiredInventoryReport = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await api.get('/products');
                const today = new Date();
                const sixtyDaysFromNow = new Date();
                sixtyDaysFromNow.setDate(today.getDate() + 60);

                const processedProducts = data
                    .filter(p => p.expiryDate)
                    .map(p => {
                        const expiry = new Date(p.expiryDate);
                        let status = 'Valid';
                        if (expiry < today) {
                            status = 'Expired';
                        } else if (expiry <= sixtyDaysFromNow) {
                            status = 'At-Risk';
                        }
                        return { ...p, status, expiryDate: expiry };
                    })
                    .filter(p => p.status !== 'Valid')
                    .sort((a, b) => a.expiryDate - b.expiryDate);

                setProducts(processedProducts);
            } catch (error) {
                console.error("Failed to fetch products for report", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Expired':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Expired</span>;
            case 'At-Risk':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">At-Risk (Expires in &lt; 60 days)</span>;
            default:
                return null;
        }
    };

    if (loading) return <div>Loading report...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Expired & At-Risk Inventory</h1>
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.expiryDate.toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(product.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpiredInventoryReport;