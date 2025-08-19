const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private/Admin
exports.createCustomer = async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    const customerExists = phone && await Customer.findOne({ phone });
    if (customerExists) {
        return res.status(400).json({ message: 'Customer with this phone number already exists' });
    }
    const customer = await Customer.create({ name, email, phone, address });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
exports.updateCustomer = async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            customer.name = name || customer.name;
            customer.email = email || customer.email;
            customer.phone = phone || customer.phone;
            customer.address = address || customer.address;
            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};