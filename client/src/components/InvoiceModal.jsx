import React, { useState, useEffect } from 'react';
import api from '../services/api';

const InvoiceModal = ({ sale, onClose }) => {
    const [settings, setSettings] = useState({
        companyName: 'Apothecary POS',
        address: 'Medan, North Sumatra',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                if (data) {
                    setSettings(data);
                }
            } catch (error) {
                console.error("Could not fetch settings for invoice, using defaults.", error);
            }
        };
        fetchSettings();
    }, []);

    if (!sale) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50 print:bg-white">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col print:shadow-none print:border-none">
                <div id="invoice-print-area" className="p-8 md:p-12">
                    {/* Header */}
                    <header className="flex justify-between items-start pb-6 border-b">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-sky-700">{settings.companyName}</h1>
                            <p className="text-sm text-gray-500 max-w-xs">{settings.address}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-semibold uppercase text-gray-700">Invoice</h2>
                            <p className="text-sm text-gray-500"># {sale._id}</p>
                        </div>
                    </header>

                    {/* Customer and Invoice Details */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</h3>
                            {sale.customerId ? (
                                <>
                                    <p className="font-bold text-gray-800">{sale.customerId.name}</p>
                                    {sale.customerId.phone && <p className="text-gray-600">{sale.customerId.phone}</p>}
                                    {sale.customerId.address && <p className="text-gray-600">{sale.customerId.address}</p>}
                                </>
                            ) : (
                                <p className="text-gray-600">Walk-in Customer</p>
                            )}
                        </div>
                        <div className="text-left md:text-right">
                            <dl className="grid grid-cols-2 gap-x-4">
                                <dt className="font-semibold text-gray-500">Date:</dt>
                                <dd className="text-gray-800">{new Date(sale.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</dd>
                                
                                <dt className="font-semibold text-gray-500">Cashier:</dt>
                                <dd className="text-gray-800">{sale.cashierId.username}</dd>

                                <dt className="font-semibold text-gray-500">Payment:</dt>
                                <dd className="text-gray-800">{sale.paymentMethod}</dd>
                                
                                {sale.includeTherapistOnInvoice && sale.therapistId && (
                                    <>
                                        <dt className="font-semibold text-gray-500">Therapist:</dt>
                                        <dd className="text-gray-800">{sale.therapistId.name}</dd>
                                    </>
                                )}
                            </dl>
                        </div>
                    </section>
                    
                    {/* Items Table */}
                    <section>
                        <table className="min-w-full text-sm">
                            <thead className="border-b-2 border-gray-300">
                                <tr>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">Description</th>
                                    <th className="px-2 py-3 text-center font-bold text-gray-700 uppercase tracking-wider">Qty</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 uppercase tracking-wider">Unit Price</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map(item => (
                                    <tr key={item._id} className="border-b border-gray-200">
                                        <td className="px-2 py-4 whitespace-nowrap text-gray-800">
                                            {item.name}
                                            {item.note && <p className="text-xs text-gray-500 italic">- {item.note}</p>}
                                        </td>
                                        <td className="px-2 py-4 whitespace-nowrap text-center text-gray-600">{item.quantity}</td>
                                        <td className="px-2 py-4 whitespace-nowrap text-right text-gray-600">Rp{item.price.toLocaleString('id-ID')}</td>
                                        <td className="px-2 py-4 whitespace-nowrap text-right font-medium text-gray-800">Rp{(item.price * item.quantity).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Footer Totals */}
                    <section className="flex justify-end mt-8">
                        <div className="w-full max-w-sm space-y-3">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Subtotal</span>
                                <span>Rp{(sale.subtotal).toLocaleString('id-ID')}</span>
                            </div>
                            {sale.discount > 0 && (
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>Discount ({sale.voucherCode})</span>
                                    <span>- Rp{sale.discount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {sale.additionalFee?.amount > 0 && sale.additionalFee.includeOnInvoice && (
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>{sale.additionalFee.description}</span>
                                    <span>+ Rp{sale.additionalFee.amount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {sale.transportationFee?.amount > 0 && sale.transportationFee.includeOnInvoice && (
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>Transportation</span>
                                    <span>+ Rp{sale.transportationFee.amount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-bold text-gray-900 bg-gray-100 p-3 rounded-md">
                                <span>Total</span>
                                <span>Rp{sale.totalAmount.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </section>

                    <footer className="text-center text-sm text-gray-500 mt-12 pt-6 border-t">
                        <p>Thank you for your purchase!</p>
                    </footer>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-lg print:hidden">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        Close
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                        Print / Save PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;