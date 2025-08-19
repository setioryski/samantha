import React, { useState } from 'react';

const StockAdjustmentModal = ({ product, onClose, onSave }) => {
    const [quantityChanged, setQuantityChanged] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            productId: product._id,
            quantityChanged: parseInt(quantityChanged, 10),
            reason,
            notes
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Adjust Stock for {product.name}</h3>
                <p className="text-sm text-gray-500">Current Stock: {product.stock}</p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <input type="number" value={quantityChanged} onChange={(e) => setQuantityChanged(e.target.value)} placeholder="Quantity Change (+/-)" className="w-full p-2 border rounded" required />
                    <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded" required>
                        <option value="">Select a Reason</option>
                        <option>Damaged</option>
                        <option>Lost</option>
                        <option>Expired</option>
                        <option>Stock Count Correction</option>
                    </select>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full p-2 border rounded"></textarea>
                    
                    <div className="pt-4 flex justify-end gap-2">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Save Adjustment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;