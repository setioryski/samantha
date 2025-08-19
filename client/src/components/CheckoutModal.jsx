import React, { useState } from 'react';

const CheckoutModal = ({ totalAmount, onClose, onConfirm }) => {
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const handleConfirm = () => {
        onConfirm(paymentMethod);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-4">Checkout</h2>
                <div className="mb-4">
                    <p className="text-lg">Total Amount:</p>
                    <p className="text-3xl font-bold text-sky-700">Rp{totalAmount.toLocaleString('id-ID')}</p>
                </div>
                <div className="mb-6">
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                    </label>
                    <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option>Cash</option>
                        <option>Card</option>
                        <option>Digital</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;