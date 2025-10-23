// server/controllers/therapistController.js
const Therapist = require('../models/Therapist');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const mongoose = require('mongoose'); // Import mongoose

// @desc    Get therapist performance report
// @route   GET /api/therapists/report
// @access  Private/Admin
exports.getTherapistReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Ensure dates are provided
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required for the report.' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const dateMatch = { $gte: start, $lte: end };

        const report = await Therapist.aggregate([
            // Stage 1: Lookup paid sales within the date range
            {
                $lookup: {
                    from: 'sales',
                    let: { therapistId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$therapistId', '$$therapistId'] },
                                status: 'Completed',
                                paymentStatus: 'Paid',
                                createdAt: dateMatch // Apply date range
                            }
                        },
                         // --- Calculate Fee Per Sale ---
                        {
                            $addFields: {
                                feeEarnedOnSale: { $sum: '$items.therapistFee' } // Calculate total fee for this sale
                            }
                        },
                         // --- Project needed fields for the sale ---
                        {
                            $project: {
                                _id: 1,
                                createdAt: 1,
                                totalAmount: 1,
                                feeEarnedOnSale: 1 // Include the calculated fee
                                // items: 0 // Optionally exclude items array now
                            }
                        }
                    ],
                    as: 'paidSales' // Array of sales with feeEarnedOnSale calculated
                }
            },

            // Stage 2: Lookup expenses within the date range
            {
                $lookup: {
                    from: 'expenses',
                    let: { therapistId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$therapistId', '$$therapistId'] },
                                date: dateMatch // Apply date range
                            }
                        }
                    ],
                    as: 'relatedExpenses'
                }
            },

            // Stage 3: Calculate totals and project the required fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    // Sum the pre-calculated feeEarnedOnSale from each sale document
                    totalFees: { $ifNull: [ { $sum: '$paidSales.feeEarnedOnSale' }, 0 ] },
                    totalExpenses: { $ifNull: [ { $sum: '$relatedExpenses.amount' }, 0 ] }, // Sum expenses
                    transactionCount: { $size: '$paidSales' }, // Count number of sales documents
                    // Keep the paidSales array with details for the modal
                    contributingSales: '$paidSales'
                }
            },

            // Stage 4: Calculate Total Earnings (Fees + Expenses)
            {
                $addFields: {
                   totalEarnings: { $add: ['$totalFees', '$totalExpenses'] }
                }
            },

            // Stage 5: Filter out therapists with zero activity (optional)
             {
                $match: {
                    $or: [
                        { totalFees: { $gt: 0 } },
                        { totalExpenses: { $gt: 0 } }
                    ]
                }
             },

            // Stage 6: Sort by totalEarnings descending
            { $sort: { totalEarnings: -1 } },

            // Stage 7: Limit to top 10 (if needed)
            { $limit: 10 },

             // Stage 8: Final reshape for frontend
            {
                $project: {
                    _id: 0,
                    therapistId: '$_id',
                    name: '$name',
                    transactionCount: '$transactionCount',
                    totalFees: '$totalFees',
                    totalExpenses: '$totalExpenses',
                    totalEarnings: '$totalEarnings',
                    contributingSales: { // Project the fields needed for the modal from contributingSales
                         $map: {
                             input: "$contributingSales",
                             as: "sale",
                             in: {
                                 saleId: "$$sale._id",
                                 date: "$$sale.createdAt",
                                 totalAmount: "$$sale.totalAmount",
                                 feeEarnedOnSale: "$$sale.feeEarnedOnSale" // Make sure this is passed
                             }
                         }
                    }
                }
            }
        ]);

        res.json(report);
    } catch (error) {
        console.error(`Therapist Report Error: ${error.message}`);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


// @desc    Get all therapists with their expenses in a date range
// @route   GET /api/therapists
// @access  Private/Admin
exports.getTherapists = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Base pipeline to get therapists
        const pipeline = [
            { $sort: { name: 1 } },
        ];

        // If date range is provided, add stages to lookup and calculate expenses
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            pipeline.push(
                {
                    $lookup: {
                        from: 'expenses', // The collection name for Expense model
                        let: { therapistId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$therapistId', '$$therapistId'] },
                                    date: { $gte: start, $lte: end } // Filter expenses by date
                                }
                            }
                        ],
                        as: 'expensesInRange'
                    }
                },
                {
                    $addFields: {
                        // Calculate sum, ensuring it handles cases with no expenses correctly
                         totalExpensesInRange: { $ifNull: [ { $sum: '$expensesInRange.amount' }, 0 ] }
                    }
                },
                {
                    $project: { // Remove the temporary expensesInRange field if not needed
                        expensesInRange: 0
                    }
                }
            );
        } else {
             // If no date range, explicitly set totalExpensesInRange to 0
             pipeline.push({
                 $addFields: {
                     totalExpensesInRange: 0
                 }
             });
        }


        const therapists = await Therapist.aggregate(pipeline);
        res.json(therapists);
    } catch (error) {
        console.error(`Get Therapists Error: ${error.message}`);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get active therapists
// @route   GET /api/therapists/active
// @access  Private
exports.getActiveTherapists = async (req, res) => {
    try {
        const therapists = await Therapist.find({ isActive: true }).sort({ name: 1 });
        res.json(therapists);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Create a therapist
// @route   POST /api/therapists
// @access  Private/Admin
exports.createTherapist = async (req, res) => {
    const { name, feePercentage } = req.body;
    try {
        const therapistExists = await Therapist.findOne({ name });
        if (therapistExists) {
            return res.status(400).json({ message: 'A therapist with this name already exists' });
        }
        const therapist = await Therapist.create({ name, feePercentage });
        res.status(201).json(therapist);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Update a therapist
// @route   PUT /api/therapists/:id
// @access  Private/Admin
exports.updateTherapist = async (req, res) => {
    const { name, isActive, feePercentage } = req.body;
    try {
        const therapist = await Therapist.findById(req.params.id);
        if (therapist) {
            therapist.name = name || therapist.name;
            therapist.isActive = isActive !== undefined ? isActive : therapist.isActive;
            therapist.feePercentage = feePercentage !== undefined ? feePercentage : therapist.feePercentage;
            const updatedTherapist = await therapist.save();
            res.json(updatedTherapist);
        } else {
            res.status(404).json({ message: 'Therapist not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Delete a therapist
// @route   DELETE /api/therapists/:id
// @access  Private/Admin
exports.deleteTherapist = async (req, res) => {
    try {
        // Find expenses linked to the therapist
        const relatedExpenses = await Expense.find({ therapistId: req.params.id });
        if (relatedExpenses.length > 0) {
            return res.status(400).json({ message: 'Cannot delete therapist with associated expenses. Please reassign or delete expenses first.' });
        }

        const therapist = await Therapist.findById(req.params.id);
        if (therapist) {
            await therapist.deleteOne();
            res.json({ message: 'Therapist removed' });
        } else {
            res.status(404).json({ message: 'Therapist not found' });
        }
    } catch (error) {
         console.error(`Delete Therapist Error: ${error.message}`); // Log the error
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};