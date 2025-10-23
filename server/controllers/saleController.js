// server/controllers/saleController.js
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Therapist = require('../models/Therapist');
const Expense = require('../models/Expense');


// @desc    Get all selling products
// @route   GET /api/sales/allselling
// @access  Private/Admin
exports.getAllSellingProducts = async (req, res) => {
  try {
    const allSellingProducts = await Sale.aggregate([
      { $match: { status: 'Completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);
    res.json(allSellingProducts);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// @desc    Get top selling products
// @route   GET /api/sales/topproducts
// @access  Private/Admin
exports.getTopProducts = async (req, res) => {
  try {
    const topProducts = await Sale.aggregate([
      { $match: { status: 'Completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);
    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
exports.addSale = async (req, res) => {
  const {
    items, subtotal, discount, voucherCode, totalAmount, paymentMethod,
    customerId, paymentStatus, therapistId, includeTherapistOnInvoice, // <-- therapistId added here
    additionalFee, transportationFee
  } = req.body; // <-- Destructure therapistId

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ '_id': { $in: productIds } }).session(session);
    let therapist = null;
    if (therapistId) { // Check if therapistId is provided
        therapist = await Therapist.findById(therapistId).session(session);
        if (!therapist) {
            throw new Error(`Therapist with id ${therapistId} not found.`);
        }
    }

    if (customerId) {
        const customer = await Customer.findById(customerId).session(session);
        if (!customer) {
            throw new Error(`Customer with id ${customerId} not found.`);
        }
    }

    const saleItems = items.map(item => {
        const product = products.find(p => p._id.toString() === item.productId);
        if (!product) {
            throw new Error(`Product with id ${item.productId} not found.`);
        }
        if (product.stock < item.quantity) {
            throw new Error(`Not enough stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        let therapistFee = 0;
        if (therapist && therapist.feePercentage > 0) {
            therapistFee = (item.price * item.quantity) * (therapist.feePercentage / 100);
        }

        return {
            ...item,
            basePrice: product.basePrice,
            therapistFee
        };
    });

    // Create the sale record
    const sale = new Sale({
      items: saleItems,
      cashierId: req.user._id,
      customerId,
      therapistId, // <-- Include therapistId
      includeTherapistOnInvoice,
      subtotal,
      discount,
      voucherCode,
      additionalFee,
      transportationFee,
      totalAmount,
      paymentMethod: paymentStatus === 'Paid' ? paymentMethod : 'Pending',
      paymentStatus: paymentStatus || 'Unpaid',
      orderStatus: 'Pending',
      status: 'Completed',
    });
    const createdSale = await sale.save({ session });

    // Decrease stock for all orders, paid or unpaid
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      }, { session });
    }

    // If the sale is paid, handle therapist and transportation fees as expenses
    if (paymentStatus === 'Paid') {
        const totalTherapistFee = saleItems.reduce((acc, item) => acc + item.therapistFee, 0);
        if (therapist && totalTherapistFee > 0) {
            const expense = new Expense({
                description: `Therapist fee for ${therapist.name} on Sale ID: ${createdSale._id}`,
                amount: totalTherapistFee,
                category: 'Therapist Fee',
                createdBy: req.user._id,
                therapistId: therapist._id // Link therapist fee expense to therapist
            });
            await expense.save({ session });
        }
        // MODIFICATION: Link transportation expense to therapist if therapist exists
        if (transportationFee && transportationFee.amount > 0) {
            const transportExpense = new Expense({
                description: `Transportation fee for Sale ID: ${createdSale._id}`,
                amount: transportationFee.amount,
                category: 'Transportation',
                createdBy: req.user._id,
                therapistId: therapist ? therapist._id : undefined // Link to therapist if available
            });
            await transportExpense.save({ session });
        }
    }

    await session.commitTransaction();

    const populatedSale = await Sale.findById(createdSale._id)
        .populate('cashierId', 'username')
        .populate('customerId', 'name phone')
        .populate('therapistId', 'name'); // <-- Populate therapist name
    res.status(201).json(populatedSale);

  } catch (error) {
    await session.abortTransaction();
    console.error(`Sale creation error: ${error.message}`);
    res.status(500).json({ message: `Server Error: ${error.message}` });
  } finally {
    session.endSession();
  }
};

// @desc    Update a sale (for unpaid orders)
// @route   PUT /api/sales/:id
// @access  Private
exports.updateSale = async (req, res) => {
    const { items, totalAmount } = req.body;
    const sale = await Sale.findById(req.params.id).populate('items.productId');

    if (!sale) {
        return res.status(404).json({ message: 'Sale not found' });
    }
    if (sale.paymentStatus === 'Paid') {
        return res.status(400).json({ message: 'Cannot edit a paid sale.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const originalItems = new Map(sale.items.map(item => [item.productId._id.toString(), item.quantity]));
        const newItems = new Map(items.map(item => [item.productId.toString(), item.quantity]));
        const productIds = new Set([...originalItems.keys(), ...newItems.keys()]);

        for (const productId of productIds) {
            const originalQty = originalItems.get(productId) || 0;
            const newQty = newItems.get(productId) || 0;
            const diff = originalQty - newQty;

            if (diff !== 0) {
                 await Product.findByIdAndUpdate(productId,
                    { $inc: { stock: diff } },
                    { session }
                );
            }
        }

        sale.items = items;
        sale.totalAmount = totalAmount; // Update total amount based on potentially changed items/fees if logic exists

        await sale.save({ session });
        await session.commitTransaction();

        // Repopulate necessary fields before sending response
        const populatedSale = await Sale.findById(sale._id)
            .populate('cashierId', 'username')
            .populate('customerId', 'name phone')
            .populate('therapistId', 'name');

        res.json(populatedSale);

    } catch (error) {
        await session.abortTransaction();
        console.error(`Sale update error: ${error.message}`);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    } finally {
        session.endSession();
    }
};

// @desc    Update sale to paid
// @route   PUT /api/sales/:id/pay
// @access  Private
exports.updateSaleToPaid = async (req, res) => {
    const { paymentMethod } = req.body;
    const sale = await Sale.findById(req.params.id).populate('therapistId');

    if (!sale) {
        return res.status(404).json({ message: 'Sale not found' });
    }
    if (sale.paymentStatus === 'Paid') {
        return res.status(400).json({ message: 'Sale has already been paid' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        sale.paymentStatus = 'Paid';
        sale.paymentMethod = paymentMethod;

        // If there's a therapist, create an expense for their fee
        if (sale.therapistId) {
            const totalTherapistFee = sale.items.reduce((acc, item) => acc + item.therapistFee, 0);
            if (totalTherapistFee > 0) {
                const expense = new Expense({
                    description: `Therapist fee for ${sale.therapistId.name} on Sale ID: ${sale._id}`,
                    amount: totalTherapistFee,
                    category: 'Therapist Fee',
                    createdBy: req.user._id,
                    therapistId: sale.therapistId._id // Link therapist fee expense to therapist
                });
                await expense.save({ session });
            }
        }

        // Create an expense for the transportation fee, linking to therapist if present
        if (sale.transportationFee && sale.transportationFee.amount > 0) {
            const transportExpense = new Expense({
                description: `Transportation fee for Sale ID: ${sale._id}`,
                amount: sale.transportationFee.amount,
                category: 'Transportation',
                createdBy: req.user._id,
                therapistId: sale.therapistId ? sale.therapistId._id : undefined // Link to therapist if available
            });
            await transportExpense.save({ session });
        }


        const updatedSale = await sale.save({ session });
        await session.commitTransaction();

         // Repopulate necessary fields before sending response
        const populatedSale = await Sale.findById(updatedSale._id)
            .populate('cashierId', 'username')
            .populate('customerId', 'name phone address') // Ensure address is populated if needed by invoice
            .populate('therapistId', 'name');

        res.json(populatedSale);
    } catch (error) {
        await session.abortTransaction();
        console.error(`Sale payment update error: ${error.message}`);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    } finally {
        session.endSession();
    }
};


// @desc    Retract a sale
// @route   PUT /api/sales/:id/retract
// @access  Private/Admin
exports.retractSale = async (req, res) => {
    // Populate therapistId to get name and ID for expense deletion
    const sale = await Sale.findById(req.params.id).populate('therapistId', 'name'); // Only populate name, ID is always there

    if (!sale) {
        return res.status(404).json({ message: 'Sale not found' });
    }
    if (sale.status === 'Retracted') {
        return res.status(400).json({ message: 'Sale has already been retracted' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Restore stock for all retracted items
        for (const item of sale.items) {
            // Ensure productId is accessed correctly, might be populated
            const productId = item.productId._id ? item.productId._id : item.productId;
            await Product.findByIdAndUpdate(productId, {
                $inc: { stock: +item.quantity }
            }, { session });
        }

        // --- MODIFICATION START ---
        // If the sale was paid, retract any associated expenses
        if (sale.paymentStatus === 'Paid') {
            // Delete therapist fee expense (if therapist was associated)
            if (sale.therapistId) {
                 // Use description and therapistId to uniquely identify the expense
                await Expense.deleteOne({
                    category: 'Therapist Fee',
                    description: `Therapist fee for ${sale.therapistId.name} on Sale ID: ${sale._id}`,
                    therapistId: sale.therapistId._id // Ensure we delete the one linked to THIS therapist for THIS sale
                }, { session });
            }

            // Delete transportation fee expense (if it existed for this sale)
            if (sale.transportationFee && sale.transportationFee.amount > 0) {
                 // Use description and potentially therapistId to uniquely identify the expense
                 await Expense.deleteOne({
                    category: 'Transportation',
                    description: `Transportation fee for Sale ID: ${sale._id}`,
                    // therapistId might be null or the therapist's ID, this covers both cases if linked
                    therapistId: sale.therapistId ? sale.therapistId._id : null
                }, { session });
            }
        }
        // --- MODIFICATION END ---


        sale.status = 'Retracted';
        // Optionally reset payment status/method if needed
        // sale.paymentStatus = 'Unpaid';
        // sale.paymentMethod = 'Pending';
        const updatedSale = await sale.save({ session });
        await session.commitTransaction();

        const populatedSale = await Sale.findById(updatedSale._id)
            .populate('cashierId', 'username')
            .populate('customerId', 'name')
            .populate('therapistId', 'name');
        res.json(populatedSale);

    } catch (error) {
        await session.abortTransaction();
        console.error(`Sale retraction error: ${error.message}`);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    } finally {
        session.endSession();
    }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private/Admin
exports.deleteSale = async (req, res) => {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
        return res.status(404).json({ message: 'Sale not found' });
    }

    // Optional: Only allow deletion of retracted sales
    if (sale.status !== 'Retracted') {
        return res.status(400).json({ message: 'Only retracted sales can be deleted.' });
    }

    try {
        await sale.deleteOne();
        res.json({ message: 'Sale removed' });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get all sales (with filtering)
// @route   GET /api/sales
// @access  Private/Admin
exports.getSales = async (req, res) => {
  try {
    const filter = {};
    const { therapistId, startDate, endDate, paymentStatus, status } = req.query; // Add filters from query

    if (therapistId) {
      filter.therapistId = therapistId;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    if (status) {
      filter.status = status;
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $lte: end };
    }


    const sales = await Sale.find(filter).sort({ createdAt: -1 }) // Apply filter
        .populate('cashierId', 'username')
        .populate('customerId', 'name')
        .populate('therapistId', 'name'); // <-- Populate therapist name
    res.json(sales);
  } catch (error) {
    console.error(`Get Sales Error: ${error.message}`);
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};


// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('cashierId', 'username')
            .populate('items.productId', 'sku') // Keep populating SKU if needed
            .populate('customerId', 'name phone address')
            .populate('therapistId', 'name'); // <-- Populate therapist name
        if (sale) {
            res.json(sale);
        } else {
            res.status(404).json({ message: 'Sale not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get sales for the current day for all users
// @route   GET /api/sales/today
// @access  Private
exports.getTodaysSales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await Sale.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
      // You might want to filter by status: 'Completed' here too, depending on requirements
      // status: 'Completed',
    }).sort({ createdAt: -1 })
      .populate('cashierId', 'username')
      .populate('customerId', 'name')
      .populate('items.productId', 'name sku')
      .populate('therapistId', 'name'); // Populate therapist

    // Calculate revenue only from 'Completed' and 'Paid' sales
    const totalRevenue = sales
      .filter(s => s.status === 'Completed' && s.paymentStatus === 'Paid')
      .reduce((acc, sale) => acc + sale.totalAmount, 0);

    res.json({ sales, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// --- Therapist Report Function ---
// Moved from the end to keep related functions together
// @desc    Get therapist performance report
// @route   GET /api/therapists/report (Note: This might be better under therapistRoutes, but included here as requested)
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

        const dateMatch = {
            $gte: start,
            $lte: end
        };

        const report = await Therapist.aggregate([
            // Stage 1: Match active therapists (optional, depending on requirements)
            // { $match: { isActive: true } },

            // Stage 2: Lookup paid sales within the date range
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
                                createdAt: dateMatch // Apply date range to sales
                            }
                        },
                        { $unwind: '$items' } // Unwind items to access therapistFee
                    ],
                    as: 'paidSales'
                }
            },

            // Stage 3: Lookup expenses within the date range
            {
                $lookup: {
                    from: 'expenses',
                    let: { therapistId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$therapistId', '$$therapistId'] },
                                date: dateMatch // Apply date range to expenses
                            }
                        }
                    ],
                    as: 'relatedExpenses'
                }
            },

            // Stage 4: Calculate totals and project the required fields
            {
                $project: {
                    _id: 1, // Keep therapist ID
                    name: 1, // Keep therapist name
                    totalFees: { $sum: '$paidSales.items.therapistFee' }, // Sum therapist fees from sales items
                    totalExpenses: { $sum: '$relatedExpenses.amount' }, // Sum expenses
                    // Count unique sales the therapist was involved in
                    transactionCount: {
                        $size: {
                           $reduce: {
                             input: "$paidSales",
                             initialValue: [],
                             in: { $setUnion: [ "$$value", [ "$$this._id" ] ] }
                           }
                        }
                    }
                }
            },

            // Stage 5: Calculate Net Total (Fees - Expenses)
            {
                $addFields: {
                   netTotal: { $subtract: ['$totalFees', '$totalExpenses'] }
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


            // Stage 7: Sort by netTotal descending (or fees, depending on preference)
            { $sort: { netTotal: -1 } },

            // Stage 8: Limit to top 10 (if needed)
            { $limit: 10 },

             // Stage 9: Final reshape if needed (ensure correct field names for frontend)
            {
                $project: {
                    _id: 0, // Exclude MongoDB _id
                    therapistId: '$_id',
                    name: '$name',
                    transactionCount: '$transactionCount',
                    totalFees: '$totalFees', // Renamed from totalEarnings
                    totalExpenses: '$totalExpenses', // Added expense total
                    netTotal: '$netTotal' // Added net total
                }
            }
        ]);

        res.json(report);
    } catch (error) {
        console.error(`Therapist Report Error: ${error.message}`);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};