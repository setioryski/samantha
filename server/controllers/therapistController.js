// server/controllers/therapistController.js
const Therapist = require('../models/Therapist');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense'); // Import Expense model

// @desc    Get therapist performance report
// @route   GET /api/therapists/report
// @access  Private/Admin
exports.getTherapistReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {
            therapistId: { $ne: null },
            status: 'Completed',
            paymentStatus: 'Paid' // Only count paid sales for earnings
        };

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const report = await Sale.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            { $group: {
                _id: '$therapistId',
                transactionCount: { $sum: 1 },
                totalEarnings: { $sum: '$items.therapistFee' }
            }},
            { $sort: { totalEarnings: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'therapists',
                localField: '_id',
                foreignField: '_id',
                as: 'therapist'
            }},
            { $unwind: '$therapist' },
            { $project: {
                _id: 0,
                therapistId: '$_id',
                name: '$therapist.name',
                transactionCount: '$transactionCount',
                totalEarnings: '$totalEarnings'
            }}
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
                        totalExpensesInRange: { $sum: '$expensesInRange.amount' }
                    }
                },
                {
                    $project: { // Remove the temporary expensesInRange field if not needed
                        expensesInRange: 0
                    }
                }
            );
        } else {
             // If no date range, set totalExpensesInRange to 0 or null
             pipeline.push({
                 $addFields: {
                     totalExpensesInRange: 0 // Or null, depending on how you want to handle it
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
// @access  Private
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