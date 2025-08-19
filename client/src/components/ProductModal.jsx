import React, { useState, useEffect } from 'react';

const ProductModal = ({ product, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        basePrice: '',
        price: '',
        stock: '',
        expiryDate: '',
        supplier: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku,
                category: product.category?._id || '',
                basePrice: product.basePrice || '',
                price: product.price,
                stock: product.stock,
                expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
                supplier: product.supplier || ''
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-30">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{product ? 'Edit Product' : 'Add New Product'}</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" required />
                    <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="SKU" className="w-full p-2 border rounded" required />
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded" required>
                        <option value="">Select a Category</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                    <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} placeholder="Base Price" className="w-full p-2 border rounded" required />
                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Selling Price" className="w-full p-2 border rounded" required />
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" className="w-full p-2 border rounded" required />
                    <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="w-full p-2 border rounded" />
                    <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Supplier" className="w-full p-2 border rounded" />
                    
                    <div className="pt-4 flex justify-end gap-2">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Save Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;