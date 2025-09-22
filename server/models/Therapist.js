const mongoose = require('mongoose');

const TherapistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  feePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Therapist', TherapistSchema);