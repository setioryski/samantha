// client/src/components/EditSaleModal.jsx

import React, { useState, useEffect } from 'react';

const EditSaleModal = ({ sale, products, onClose, onUpdate, onProcessPayment }) => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (sale) {
            // Salin item dari pesanan ke state lokal untuk diedit
            setItems(sale.items.map(item => ({...item, productId: item.productId._id || item.productId })));
        }
    }, [sale]);

    if (!sale) return null;

    const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleQuantityChange = (productId, newQuantity) => {
        const productInfo = products.find(p => p._id === productId);
        setItems(currentItems => {
            if (newQuantity <= 0) {
                return currentItems.filter(item => item.productId !== productId);
            }
            if (newQuantity > productInfo.stock + (sale.items.find(i=>i.productId===productId)?.quantity || 0) ) {
                // Logic to prevent quantity exceeding available stock
                alert(`Cannot exceed available stock for ${productInfo.name}.`);
                return currentItems;
            }
            return currentItems.map(item =>
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            );
        });
    };
    
    const handleAddToCart = (product) => {
         if (product.stock <= 0) {
            alert(`${product.name} is out of stock.`);
            return;
        }
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.productId === product._id);
            if(existingItem) {
                 if (existingItem.quantity < product.stock) {
                    return currentItems.map(item => item.productId === product._id ? {...item, quantity: item.quantity + 1} : item);
                 }
                 return currentItems;
            }
            return [...currentItems, { productId: product._id, name: product.name, price: product.price, basePrice: product.basePrice, quantity: 1}];
        });
    };


    const handleUpdate = () => {
        const updatedSaleData = {
            items,
            totalAmount
        };
        onUpdate(sale._id, updatedSaleData);
    };
    
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4">Edit Unpaid Order</h2>
                <div className="flex-grow flex gap-4 overflow-hidden">
                    {/* Items currently in the order */}
                    <div className="w-1/2 flex flex-col">
                         <h3 className="text-lg font-semibold border-b pb-2 mb-2">Current Items</h3>
                         <div className="flex-grow overflow-y-auto pr-2">
                             {items.length > 0 ? items.map(item => (
                                <div key={item.productId} className="flex justify-between items-center py-2 border-b">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} className="bg-gray-200 rounded-full w-6 h-6">-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="bg-gray-200 rounded-full w-6 h-6">+</button>
                                        </div>
                                    </div>
                                    <p className="font-bold">Rp{(item.quantity * item.price).toLocaleString('id-ID')}</p>
                                </div>
                            )) : <p className="text-gray-500">No items in order.</p>}
                         </div>
                         <div className="border-t pt-4 mt-auto">
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Total:</span>
                                <span>Rp{totalAmount.toLocaleString('id-ID')}</span>
                            </div>
                         </div>
                    </div>

                    {/* Add new items */}
                    <div className="w-1/2 flex flex-col border-l pl-4">
                         <h3 className="text-lg font-semibold border-b pb-2 mb-2">Add Products</h3>
                        <input
                            type="text"
                            placeholder="Search products to add..."
                            className="w-full p-2 border rounded-lg mb-2"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div className="flex-grow overflow-y-auto">
                           <div className="grid grid-cols-2 gap-2">
                               {filteredProducts.map(product => (
                                   <div key={product._id} onClick={() => handleAddToCart(product)} className="border rounded p-2 text-center cursor-pointer hover:bg-gray-100">
                                       <p className="font-semibold text-sm">{product.name}</p>
                                       <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                       <p className="text-sm font-bold text-sky-700 mt-1">Rp{product.price.toLocaleString('id-ID')}</p>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Order</button>
                    <button onClick={() => onProcessPayment(sale)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Proceed to Payment</button>
                </div>
            </div>
        </div>
    );
};

export default EditSaleModal;