// setioryski/apptechary-app/apptechary-app-new3/server/models/Sale.js

const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    basePrice: { type: Number, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    note: { type: String, trim: true } // <-- Baris ditambahkan
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Digital', 'Pending'], default: 'Pending' },
  paymentStatus: { type: String, required: true, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  orderStatus: { type: String, required: true, enum: ['Pending', 'Completed', 'Served'], default: 'Pending' },
  status: { type: String, required: true, enum: ['Completed', 'Retracted'], default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);