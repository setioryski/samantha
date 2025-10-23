// server/controllers/therapistController.js
const Therapist = require('../models/Therapist'); //
const Sale = require('../models/Sale'); //
const Expense = require('../models/Expense'); //
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
                    from: 'sales', //
                    let: { therapistId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$therapistId', '$$therapistId'] },
                                status: 'Completed', //
                                paymentStatus: 'Paid', //
                                createdAt: dateMatch // Apply date range
                            }
                        },
                         // Keep basic sale info + items for fee calculation
                         {
                            $project: {
                                _id: 1,
                                createdAt: 1,
                                items: 1, // Keep items array
                                totalAmount: 1 //
                            }
                        }
                    ],
                    as: 'paidSales'
                }
            },

            // Stage 2: Lookup expenses within the date range
            {
                $lookup: {
                    from: 'expenses', //
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

            // Stage 3: Unwind sales *after* expense lookup to process fees
             { $unwind: { path: '$paidSales', preserveNullAndEmptyArrays: true } }, // Keep therapists even if they have 0 sales
             { $unwind: { path: '$paidSales.items', preserveNullAndEmptyArrays: true } }, // Unwind items to access fee

            // Stage 4: Group back by therapist to calculate totals and collect sale details
            {
                $group: {
                    _id: '$_id', // Group by therapist ID
                    name: { $first: '$name' }, // Get therapist name
                    totalFees: { $sum: { $ifNull: ['$paidSales.items.therapistFee', 0] } }, // Sum fees
                    totalExpenses: { $first: { $sum: '$relatedExpenses.amount' } }, // Sum expenses
                    // Collect relevant sale details for the modal
                    contributingSales: {
                        $addToSet: { // Use $addToSet to avoid duplicates if items were unwound
                             $cond: { // Only add if paidSales exists
                                if: "$paidSales._id",
                                then: {
                                    saleId: "$paidSales._id",
                                    date: "$paidSales.createdAt",
                                    totalAmount: "$paidSales.totalAmount",
                                    // Calculate fee for this specific sale (summing items again if needed)
                                    // Note: This adds complexity. Simpler to just show Sale ID/Date/Total
                                    // For simplicity, we'll rely on frontend to show full invoice later if clicked
                                },
                                else: null // Represent no sale contribution explicitly if needed, or omit
                             }
                        }
                    },
                     // Keep track of unique sale IDs for transaction count
                    uniqueSaleIds: { $addToSet: "$paidSales._id" }
                }
            },
             // Remove nulls potentially added by $addToSet in the previous step
             {
                 $addFields: {
                    contributingSales: {
                        $filter: {
                            input: "$contributingSales",
                            as: "sale",
                            cond: { $ne: [ "$$sale", null ] }
                        }
                    },
                    uniqueSaleIds: {
                         $filter: {
                             input: "$uniqueSaleIds",
                             as: "id",
                             cond: { $ne: [ "$$id", null ] }
                         }
                    }
                 }
            },

            // Stage 5: Calculate Total Earnings and Transaction Count
            {
                $addFields: {
                   totalEarnings: { $add: ['$totalFees', '$totalExpenses'] }, // Total Earnings = Fees + Expenses
                   transactionCount: { $size: '$uniqueSaleIds' } // Count based on unique IDs collected
                }
            },

            // Stage 6: Filter out therapists with zero activity (optional)
             {
                $match: {
                    $or: [
                        { totalFees: { $gt: 0 } },
                        { totalExpenses: { $gt: 0 } }
                    ]
                }
             },

            // Stage 7: Sort by totalEarnings descending
            { $sort: { totalEarnings: -1 } }, // Sort by the new totalEarnings

            // Stage 8: Limit to top 10 (if needed)
            { $limit: 10 },

             // Stage 9: Final reshape for frontend
            {
                $project: {
                    _id: 0,
                    therapistId: '$_id',
                    name: '$name',
                    transactionCount: '$transactionCount',
                    totalFees: '$totalFees',
                    totalExpenses: '$totalExpenses',
                    totalEarnings: '$totalEarnings',
                    contributingSales: 1 // Pass the collected sales details
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
            { $sort: { name: 1 } }, //
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
                                    $expr: { $eq: ['$therapistId', '$$therapistId'] }, //
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
                         totalExpensesInRange: { $ifNull: [ { $sum: '$expensesInRange.amount' }, 0 ] } //
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
        const therapists = await Therapist.find({ isActive: true }).sort({ name: 1 }); //
        res.json(therapists);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Create a therapist
// @route   POST /api/therapists
// @access  Private
exports.createTherapist = async (req, res) => {
    const { name, feePercentage } = req.body; //
    try {
        const therapistExists = await Therapist.findOne({ name }); //
        if (therapistExists) {
            return res.status(400).json({ message: 'A therapist with this name already exists' });
        }
        const therapist = await Therapist.create({ name, feePercentage }); //
        res.status(201).json(therapist);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Update a therapist
// @route   PUT /api/therapists/:id
// @access  Private/Admin
exports.updateTherapist = async (req, res) => {
    const { name, isActive, feePercentage } = req.body; //
    try {
        const therapist = await Therapist.findById(req.params.id);
        if (therapist) {
            therapist.name = name || therapist.name;
            therapist.isActive = isActive !== undefined ? isActive : therapist.isActive;
            therapist.feePercentage = feePercentage !== undefined ? feePercentage : therapist.feePercentage; //
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
        const relatedExpenses = await Expense.find({ therapistId: req.params.id }); //
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