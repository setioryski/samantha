import React, { useState, useEffect } from 'react';

const CustomerModal = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || ''
            });
        } else {
            setFormData({ name: '', email: '', phone: '', address: '' });
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded" required />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full p-2 border rounded" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email (Optional)" className="w-full p-2 border rounded" />
                    <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address (Optional)" className="w-full p-2 border rounded"></textarea>
                    
                    <div className="pt-4 flex justify-end gap-2">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Customer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;