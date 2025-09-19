const Therapist = require('../models/Therapist');
const Sale = require('../models/Sale');

// @desc    Get therapist performance report
// @route   GET /api/therapists/report
// @access  Private/Admin
exports.getTherapistReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {
            therapistId: { $ne: null },
            status: 'Completed'
        };

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const report = await Sale.aggregate([
            { $match: matchStage },
            { $group: {
                _id: '$therapistId',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
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
                transactionCount: '$count'
            }}
        ]);

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


// @desc    Get all therapists
// @route   GET /api/therapists
// @access  Private/Admin
exports.getTherapists = async (req, res) => {
    try {
        const therapists = await Therapist.find({}).sort({ name: 1 });
        res.json(therapists);
    } catch (error) {
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
    const { name } = req.body;
    try {
        const therapistExists = await Therapist.findOne({ name });
        if (therapistExists) {
            return res.status(400).json({ message: 'A therapist with this name already exists' });
        }
        const therapist = await Therapist.create({ name });
        res.status(201).json(therapist);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Update a therapist
// @route   PUT /api/therapists/:id
// @access  Private/Admin
exports.updateTherapist = async (req, res) => {
    const { name, isActive } = req.body;
    try {
        const therapist = await Therapist.findById(req.params.id);
        if (therapist) {
            therapist.name = name || therapist.name;
            therapist.isActive = isActive !== undefined ? isActive : therapist.isActive;
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
        const therapist = await Therapist.findById(req.params.id);
        if (therapist) {
            await therapist.deleteOne();
            res.json({ message: 'Therapist removed' });
        } else {
            res.status(404).json({ message: 'Therapist not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};