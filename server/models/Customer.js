const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, sparse: true }, // sparse allows multiple nulls
  phone: { type: String, trim: true, sparse: true, unique: true }, // unique phone number
  address: { type: String, trim: true },
}, { timestamps: true });

// To handle unique constraint on phone allowing multiple nulls
CustomerSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

module.exports = mongoose.model('Customer', CustomerSchema);