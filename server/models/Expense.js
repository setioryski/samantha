// server/models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // ADDED: Optional link to a therapist
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: false },
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);