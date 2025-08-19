const mongoose = require('mongoose');

const AdjustmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantityChanged: { type: Number, required: true }, // Can be positive or negative
  reason: { 
    type: String, 
    required: true, 
    enum: ['Damaged', 'Lost', 'Expired', 'Stock Count Correction', 'Initial Stock'] 
  },
  adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Adjustment', AdjustmentSchema);