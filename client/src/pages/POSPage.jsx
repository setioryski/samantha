// setioryski/apptechary-app/apptechary-app-new3/client/src/pages/POSPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import CheckoutModal from '../components/CheckoutModal';
import InvoiceModal from '../components/InvoiceModal';
import { useToast } from '../context/ToastContext';
import CustomerModal from '../components/CustomerModal';
import ConfirmationModal from '../components/ConfirmationModal';
import EditSaleModal from '../components/EditSaleModal'; 

// Component for viewing sale details
const SaleDetailsModal = ({ sale, onClose }) => {
    if (!sale) return null;
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Order Details</h3>
                <div className="text-sm mb-4">
                    <p><strong>Time:</strong> {new Date(sale.createdAt).toLocaleTimeString()}</p>
                    <p><strong>Cashier:</strong> {sale.cashierId.username}</p>
                    {sale.customerId && <p><strong>Customer:</strong> {sale.customerId.name}</p>}
                </div>
                <ul className="divide-y max-h-60 overflow-y-auto">
                    {sale.items.map(item => (
                        <li key={item._id || item.productId} className="py-2">
                            <div className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-semibold">Rp{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                            {item.note && <p className="text-xs text-gray-500 pl-4">- {item.note}</p>}
                        </li>
                    ))}
                </ul>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-lg">Rp{sale.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Close</button>
                </div>
            </div>
        </div>
    );
};


const POSPage = () => {
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isConfirmOrderOpen, setIsConfirmOrderOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [completedSale, setCompletedSale] = useState(null);
    const [saleToPay, setSaleToPay] = useState(null);
    const { showToast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [todaysSales, setTodaysSales] = useState([]);
    const [todaysRevenue, setTodaysRevenue] = useState(0);
    const [loadingSales, setLoadingSales] = useState(true);
    const [viewingSale, setViewingSale] = useState(null);
    const [editingNoteFor, setEditingNoteFor] = useState(null);
    const [currentNote, setCurrentNote] = useState('');

    const fetchTodaysSales = useCallback(async () => {
        setLoadingSales(true);
        try {
            const { data } = await api.get('/sales/today');
            setTodaysSales(data.sales);
            setTodaysRevenue(data.totalRevenue);
        } catch (error) {
            console.error("Failed to fetch today's sales", error);
            showToast("Could not load today's sales.", 'error');
        } finally {
            setLoadingSales(false);
        }
    }, [showToast]);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [productsRes, customersRes] = await Promise.all([
                api.get('/products'),
                api.get('/customers')
            ]);
            setProducts(productsRes.data);
            setCustomers(customersRes.data);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
            showToast('Error fetching page data', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);
    
    useEffect(() => {
        fetchInitialData();
        fetchTodaysSales();
    }, [fetchInitialData, fetchTodaysSales]);
    
    const resetCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setSearchTerm('');
    }

    const addToCart = (product) => {
        if (product.stock <= 0) {
            showToast(`${product.name} is out of stock.`, 'error');
            return;
        }
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item._id === product._id);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    return currentCart.map(item =>
                        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                } else {
                    showToast(`Maximum stock for ${product.name} reached.`, 'error');
                    return currentCart;
                }
            }
            return [...currentCart, { ...product, quantity: 1, note: '' }];
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        setCart(currentCart => {
            const productInfo = products.find(p => p._id === productId);
            if (newQuantity <= 0) {
                return currentCart.filter(item => item._id !== productId);
            }
            if (newQuantity > productInfo.stock) {
                showToast(`Maximum stock for ${productInfo.name} is ${productInfo.stock}.`, 'error');
                return currentCart.map(item =>
                    item._id === productId ? { ...item, quantity: productInfo.stock } : item
                );
            }
            return currentCart.map(item =>
                item._id === productId ? { ...item, quantity: newQuantity } : item
            );
        });
    };

    const handleNoteClick = (item) => {
        setEditingNoteFor(item._id);
        setCurrentNote(item.note || '');
    };

    const handleNoteChange = (productId, newNote) => {
        setCart(cart.map(item => item._id === productId ? { ...item, note: newNote } : item));
    };

    const handleSaveNote = (productId) => {
        handleNoteChange(productId, currentNote);
        setEditingNoteFor(null);
    };

    const handlePlaceOrder = () => {
        if (cart.length > 0) {
            setIsConfirmOrderOpen(true);
        } else {
            showToast('Cart is empty', 'error');
        }
    };
    
    const handlePayLater = async () => {
        setIsConfirmOrderOpen(false);
        const saleData = {
            items: cart.map(({ _id, name, price, basePrice, quantity, note }) => ({ productId: _id, name, price, basePrice, quantity, note })),
            totalAmount: totalAmount,
            paymentStatus: 'Unpaid',
            customerId: selectedCustomer ? selectedCustomer._id : null,
        };
        try {
            await api.post('/sales', saleData);
            showToast('Order saved as unpaid.', 'success');
            resetCart();
            fetchTodaysSales();
            fetchInitialData();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save order.', 'error');
        }
    };

    const handlePayNow = () => {
        setIsConfirmOrderOpen(false);
        setIsCheckoutOpen(true);
    };

    const handleConfirmCheckout = async (paymentMethod) => {
        if (saleToPay) {
            try {
                await api.put(`/sales/${saleToPay._id}/pay`, { paymentMethod });
                showToast('Payment successful!', 'success');
                const { data } = await api.get(`/sales/${saleToPay._id}`);
                setCompletedSale(data);
                setIsInvoiceOpen(true);
            } catch (error) {
                showToast(error.response?.data?.message || 'Payment failed.', 'error');
            } finally {
                setIsCheckoutOpen(false);
                setSaleToPay(null);
                fetchTodaysSales();
                fetchInitialData();
            }
        } else {
            const saleData = {
                items: cart.map(({ _id, name, price, basePrice, quantity, note }) => ({ productId: _id, name, price, basePrice, quantity, note })),
                totalAmount: totalAmount,
                paymentMethod,
                paymentStatus: 'Paid',
                customerId: selectedCustomer ? selectedCustomer._id : null,
            };
            try {
                const { data: populatedSale } = await api.post('/sales', saleData);
                setCompletedSale(populatedSale);
                setIsInvoiceOpen(true);
                resetCart();
                fetchTodaysSales();
                fetchInitialData();
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to complete sale.', 'error');
            } finally {
                 setIsCheckoutOpen(false);
            }
        }
    };
    
    const handlePayForUnpaidOrder = (sale) => {
        setSaleToPay(sale);
        setIsCheckoutOpen(true);
    };

    const handleEditSale = (sale) => {
        setEditingSale(sale);
        setIsEditModalOpen(true);
    };

    const handleUpdateSale = async (saleId, updatedData) => {
        try {
            await api.put(`/sales/${saleId}`, updatedData);
            showToast('Order updated successfully!', 'success');
            setIsEditModalOpen(false);
            setEditingSale(null);
            fetchTodaysSales();
            fetchInitialData();
        } catch (error) {
             showToast(error.response?.data?.message || 'Failed to update order.', 'error');
        }
    };

    const handleSaveCustomer = async (customerData) => {
        try {
            const { data: newCustomer } = await api.post('/customers', customerData);
            setCustomers(prev => [...prev, newCustomer].sort((a,b) => a.name.localeCompare(b.name)));
            setSelectedCustomer(newCustomer);
            showToast('Customer added successfully!', 'success');
            setIsCustomerModalOpen(false);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to add customer.', 'error');
        }
    };

    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading...</div>;

    return (
        <>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
                <div className="lg:w-2/3 flex flex-col">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="🔍 Scan barcode or search product by name/SKU..."
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-grow overflow-y-auto bg-white p-4 rounded-lg shadow-sm">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product._id} onClick={() => addToCart(product)} className="border rounded-lg p-3 text-center cursor-pointer hover:bg-sky-50 transition-colors">
                                    <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                                    <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                    <p className="text-md font-bold text-sky-700 mt-2">Rp{product.price.toLocaleString('id-ID')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3 bg-white p-4 rounded-lg shadow-sm flex flex-col">
                    <div className="border-b pb-4 mb-4">
                        <h2 className="text-xl font-bold mb-2">Customer</h2>
                        {selectedCustomer ? (
                            <div className="flex justify-between items-center bg-sky-100 p-2 rounded-lg">
                                <div>
                                    <p className="font-semibold text-sky-800">{selectedCustomer.name}</p>
                                    <p className="text-xs text-sky-600">{selectedCustomer.phone}</p>
                                </div>
                                <button onClick={() => { setSelectedCustomer(null);}} className="text-red-500 font-semibold text-sm">Remove</button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedCustomer?._id || ''}
                                        onChange={(e) => {
                                            const custId = e.target.value;
                                            setSelectedCustomer(customers.find(c => c._id === custId) || null);
                                        }}
                                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    >
                                        <option value="">Select a customer...</option>
                                        {customers.map(cust => (
                                            <option key={cust._id} value={cust._id}>
                                                {cust.name} {cust.phone && `(${cust.phone})`}
                                            </option>
                                        ))}
                                    </select>
                                    <button onClick={() => setIsCustomerModalOpen(true)} className="bg-blue-500 text-white p-2 rounded-lg text-sm">New</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold border-b pb-2 mb-4">Current Order</h2>
                    <div className="flex-grow overflow-y-auto">
                        {cart.length === 0 ? (
                            <p className="text-gray-500 text-center mt-8">Cart is empty</p>
                        ) : (
                            <ul className="divide-y">
                                {cart.map(item => (
                                    <li key={item._id} className="py-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-sm">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="bg-gray-200 rounded-full w-6 h-6">-</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="bg-gray-200 rounded-full w-6 h-6">+</button>
                                                </div>
                                            </div>
                                            <p className="font-bold text-sm">Rp{(item.quantity * item.price).toLocaleString('id-ID')}</p>
                                        </div>
                                        {editingNoteFor === item._id ? (
                                            <div className="mt-2 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={currentNote}
                                                    onChange={(e) => setCurrentNote(e.target.value)}
                                                    className="w-full text-xs p-1 border rounded"
                                                    placeholder="Add a note..."
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSaveNote(item._id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Save</button>
                                            </div>
                                        ) : (
                                            <div className="mt-1">
                                                {item.note && <p className="text-xs text-gray-500 pl-1">- {item.note}</p>}
                                                <button onClick={() => handleNoteClick(item)} className="text-xs text-sky-600 hover:underline">
                                                    {item.note ? 'Edit Note' : 'Add Note'}
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-2xl font-extrabold text-sky-700">Rp{totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={cart.length === 0}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Place Order
                        </button>
                    </div>
                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-bold mb-2">Today's Sales</h3>
                        {loadingSales ? <p>Loading sales...</p> : (
                            <>
                                <div className="flex justify-between items-center mb-2 text-sm">
                                    <span className="font-semibold">Total Revenue Today:</span>
                                    <span className="font-bold text-green-700">Rp{todaysRevenue.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="overflow-y-auto max-h-40">
                                    <ul className="text-xs divide-y">
                                        {todaysSales.map(sale => (
                                            <li key={sale._id} className="py-2">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <span>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="text-gray-500"> by {sale.cashierId.username}</span>
                                                        {sale.customerId && <span className="text-blue-500"> ({sale.customerId.name})</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">Rp{sale.totalAmount.toLocaleString('id-ID')}</span>
                                                        {sale.paymentStatus === 'Unpaid' ? (
                                                            <>
                                                                <button onClick={() => handleEditSale(sale)} className="text-white bg-yellow-500 px-2 py-1 rounded-md hover:bg-yellow-600 text-xs">Edit</button>
                                                                <button onClick={() => handlePayForUnpaidOrder(sale)} className="text-white bg-blue-500 px-2 py-1 rounded-md hover:bg-blue-600 text-xs">Pay</button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => setViewingSale(sale)} className="text-blue-600 hover:underline text-xs">Details</button>
                                                        )}
                                                    </div>
                                                </div>
                                                {sale.paymentStatus === 'Unpaid' && <span className="text-xs font-bold text-red-500">UNPAID</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isConfirmOrderOpen && (
                 <ConfirmationModal
                    isOpen={isConfirmOrderOpen}
                    onClose={() => setIsConfirmOrderOpen(false)}
                    onConfirm={handlePayNow}
                    onAlternativeAction={handlePayLater}
                    title="Confirm Order"
                    message={`Total amount is Rp${totalAmount.toLocaleString('id-ID')}. How would you like to proceed?`}
                    confirmText="Pay Now"
                    alternativeText="Pay Later"
                />
            )}

            {isCheckoutOpen && (
                <CheckoutModal
                    totalAmount={saleToPay ? saleToPay.totalAmount : totalAmount}
                    onClose={() => {
                        setIsCheckoutOpen(false);
                        setSaleToPay(null);
                    }}
                    onConfirm={handleConfirmCheckout}
                />
            )}

            {isInvoiceOpen && (
                <InvoiceModal
                    sale={completedSale}
                    onClose={() => setIsInvoiceOpen(false)}
                />
            )}

            {isCustomerModalOpen && (
                <CustomerModal
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSave={handleSaveCustomer}
                />
            )}
            
            {viewingSale && (
                <SaleDetailsModal sale={viewingSale} onClose={() => setViewingSale(null)} />
            )}
             {isEditModalOpen && (
                <EditSaleModal
                    sale={editingSale}
                    products={products}
                    onClose={() => { setIsEditModalOpen(false); setEditingSale(null); }}
                    onUpdate={handleUpdateSale}
                    onProcessPayment={(sale) => {
                        setIsEditModalOpen(false);
                        handlePayForUnpaidOrder(sale);
                    }}
                />
            )}
        </>
    );
};

export default POSPage;