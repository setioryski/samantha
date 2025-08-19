const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    default: 'Apothecary POS',
  },
  address: {
    type: String,
    required: true,
    default: 'Medan, North Sumatra',
  },
  expiringSoonDays: {
    type: Number,
    required: true,
    default: 30,
  }
}, {
  // Use a single document for settings. Capped collection of size 1.
  capped: { size: 1024, max: 1 },
});

module.exports = mongoose.model('Settings', SettingsSchema);