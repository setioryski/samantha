import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CategoryPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState('');

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        try {
            await api.post('/categories', { name: newCategory });
            setNewCategory('');
            fetchCategories();
        } catch (error) {
            console.error("Failed to add category", error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/categories/${id}`);
                fetchCategories();
            } catch (error) {
                console.error("Failed to delete category", error);
                alert('Failed to delete category. It might be in use by some products.');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Categories</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
                    <form onSubmit={handleAddCategory}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Enter category name"
                                className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Existing Categories</h2>
                    <ul className="divide-y divide-gray-200">
                        {categories.map(category => (
                            <li key={category._id} className="py-2 flex justify-between items-center">
                                <span className="text-gray-700">{category.name}</span>
                                <button
                                    onClick={() => handleDeleteCategory(category._id)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CategoryPage;