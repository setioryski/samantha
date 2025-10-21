// server/controllers/expenseController.js
const Expense = require('../models/Expense');

// @desc    Get all expenses (with filtering)
// @route   GET /api/expenses
// @access  Private/Admin
exports.getExpenses = async (req, res) => {
  try {
    const filter = {};
    const { therapistId, startDate, endDate, category } = req.query; // Add filters

    if (therapistId) {
      filter.therapistId = therapistId;
    }
    if (category) {
      // Allow searching by category, case-insensitive
      filter.category = { $regex: category, $options: 'i' };
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      // Use 'date' field for filtering expenses
      filter.date = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.date = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $lte: end };
    }


    const expenses = await Expense.find(filter)
        .populate('createdBy', 'username')
        .populate('therapistId', 'name') // Populate therapist name if linked
        .sort({ date: -1 }); // Sort by expense date
    res.json(expenses);
  } catch (error) {
    console.error(`Get Expenses Error: ${error.message}`);
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private/Admin
exports.createExpense = async (req, res) => {
  try {
    // Include therapistId from request body
    const { description, amount, category, date, therapistId } = req.body;

    const expenseData = {
      description,
      amount,
      category,
      createdBy: req.user._id,
      date: date || Date.now(), // Allow specifying date, default to now
    };

    // Add therapistId if provided
    if (therapistId) {
      expenseData.therapistId = therapistId;
    }

    const expense = new Expense(expenseData);
    const createdExpense = await expense.save();
    // Populate therapist name in the response
    const populatedExpense = await Expense.findById(createdExpense._id)
        .populate('createdBy', 'username')
        .populate('therapistId', 'name');

    res.status(201).json(populatedExpense);
  } catch (error) {
     console.error(`Create Expense Error: ${error.message}`);
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            // Add check: Prevent deletion of automatically generated expenses like 'Therapist Fee' or 'Transportation'
            if (['Therapist Fee', 'Transportation', 'Stock Loss'].includes(expense.category) && expense.description.includes('Sale ID:')) {
                 return res.status(400).json({ message: 'Cannot delete automatically generated expenses tied to sales or adjustments.' });
            }
            await expense.deleteOne();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        console.error(`Delete Expense Error: ${error.message}`);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};