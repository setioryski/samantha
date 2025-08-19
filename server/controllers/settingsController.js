const Settings = require('../models/Settings');

// @desc    Get settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    // Find the single settings document, or create it if it doesn't exist
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: 'Apothecary POS',
        address: 'Medan, North Sumatra',
        expiringSoonDays: 30, // Default value
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// @desc    Create or Update settings
// @route   POST /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  const { companyName, address, expiringSoonDays } = req.body;
  try {
    // Use findOneAndUpdate with upsert to create the document if it doesn't exist
    const updatedSettings = await Settings.findOneAndUpdate(
      {}, // find any document
      { $set: { companyName, address, expiringSoonDays } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};