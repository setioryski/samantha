// client/src/components/TherapistFeeDetailsModal.jsx
import React from 'react';

const TherapistFeeDetailsModal = ({ therapistName, sales, onClose }) => {
    if (!sales) return null;

    // Calculate the total fee shown in this modal for verification (optional)
    // Note: This requires the backend to send detailed item fees or recalculate here.
    // For simplicity, we'll just list the sales.

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Fee Details for {therapistName}</h2>

                {sales.length === 0 ? (
                    <p className="text-gray-500">No sales found contributing to fees in this period.</p>
                ) : (
                    <div className="overflow-y-auto flex-grow border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sale ID</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sale Total</th>
                                    {/* Optional: Add Fee Amount if backend provides it per sale */}
                                    {/* <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Fee Earned</th> */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sales
                                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
                                    .map(sale => (
                                    <tr key={sale.saleId}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(sale.date).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{sale.saleId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">Rp{sale.totalAmount.toLocaleString('id-ID')}</td>
                                        {/* Optional: Fee Amount Cell */}
                                        {/* <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-green-600">Rp{sale.feeEarnedOnSale.toLocaleString('id-ID')}</td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

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

export default TherapistFeeDetailsModal;