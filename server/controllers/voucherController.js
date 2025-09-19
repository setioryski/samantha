const Voucher = require('../models/Voucher');

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private/Admin
exports.getVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find({}).populate('createdBy', 'username');
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get active vouchers
// @route   GET /api/vouchers/active
// @access  Private
exports.getActiveVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find({ isActive: true });
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


// @desc    Create a voucher
// @route   POST /api/vouchers
// @access  Private/Admin
exports.createVoucher = async (req, res) => {
    const { code, description, type, value } = req.body;
    try {
        const voucherExists = await Voucher.findOne({ code });
        if (voucherExists) {
            return res.status(400).json({ message: 'Voucher code already exists' });
        }
        const voucher = new Voucher({
            code,
            description,
            type,
            value,
            createdBy: req.user._id,
        });
        const createdVoucher = await voucher.save();
        res.status(201).json(createdVoucher);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Update a voucher
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
exports.updateVoucher = async (req, res) => {
    const { description, type, value, isActive } = req.body;
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (voucher) {
            voucher.description = description || voucher.description;
            voucher.type = type || voucher.type;
            voucher.value = value !== undefined ? value : voucher.value;
            voucher.isActive = isActive !== undefined ? isActive : voucher.isActive;

            const updatedVoucher = await voucher.save();
            res.json(updatedVoucher);
        } else {
            res.status(404).json({ message: 'Voucher not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


// @desc    Delete a voucher
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
exports.deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (voucher) {
            await voucher.deleteOne();
            res.json({ message: 'Voucher removed' });
        } else {
            res.status(404).json({ message: 'Voucher not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};