import React, { useState, useEffect } from 'react';

const VoucherModal = ({ voucher, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'percentage',
        value: '',
    });

    useEffect(() => {
        if (voucher) {
            setFormData({
                code: voucher.code,
                description: voucher.description,
                type: voucher.type,
                value: voucher.value,
            });
        }
    }, [voucher]);

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
                <h3 className="text-lg font-medium leading-6 text-gray-900">{voucher ? 'Edit Voucher' : 'Add New Voucher'}</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Voucher Code (e.g., PROMO10)" className="w-full p-2 border rounded" required disabled={!!voucher} />
                    <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-2 border rounded" required />
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                    </select>
                    <input type="number" name="value" value={formData.value} onChange={handleChange} placeholder={formData.type === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 15000 for Rp15.000'} className="w-full p-2 border rounded" required />
                    
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Voucher</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VoucherModal;