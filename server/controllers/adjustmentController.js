const Adjustment = require('../models/Adjustment');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// @desc    Create a stock adjustment
// @route   POST /api/adjustments
// @access  Private/Admin
exports.createAdjustment = async (req, res) => {
    const { productId, quantityChanged, reason, notes } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update product stock
        product.stock += quantityChanged;
        if (product.stock < 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Stock cannot be negative' });
        }
        await product.save({ session });

        // Create adjustment record
        const adjustment = new Adjustment({
            productId,
            productName: product.name,
            quantityChanged,
            reason,
            notes,
            adjustedBy: req.user._id
        });
        await adjustment.save({ session });
        
        // If reason is Damaged, Lost, or Expired, create an expense
        if (['Damaged', 'Lost', 'Expired'].includes(reason) && quantityChanged < 0) {
            const lossAmount = Math.abs(quantityChanged) * product.basePrice;
            const expense = new Expense({
                description: `Stock loss for ${product.name} due to: ${reason}`,
                amount: lossAmount,
                category: 'Stock Loss',
                createdBy: req.user._id,
            });
            await expense.save({ session });
        }


        await session.commitTransaction();
        session.endSession();

        res.status(201).json(adjustment);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};