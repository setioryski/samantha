const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load Models
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const users = [
  {
    username: 'admin',
    password: 'password123',
    role: 'Admin',
  },
  {
    username: 'cashier1',
    password: 'password123',
    role: 'Cashier',
  },
];

const categories = [
    { name: 'Pain Relief' },
    { name: 'Vitamins' },
    { name: 'Antibiotics' },
    { name: 'Cold & Flu' },
    { name: 'Medical Devices' }
];

const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();

    // Insert users
    for (const user of users) {
        const newUser = new User(user);
        await newUser.save();
    }
    
    // Insert categories
    const createdCategories = await Category.insertMany(categories);

    const products = [
      {
        name: 'Paracetamol 500mg',
        sku: 'PC500',
        category: createdCategories.find(c => c.name === 'Pain Relief')._id,
        basePrice: 3500,
        price: 5000,
        stock: 150,
        expiryDate: new Date('2026-12-31'),
        supplier: 'Pharma Inc.',
      },
      {
        name: 'Vitamin C 1000mg',
        sku: 'VC1000',
        category: createdCategories.find(c => c.name === 'Vitamins')._id,
        basePrice: 20000,
        price: 25000,
        stock: 200,
        expiryDate: new Date('2025-08-15'),
        supplier: 'Healthy Living Co.',
      },
      {
        name: 'Amoxicillin 250mg',
        sku: 'AMX250',
        category: createdCategories.find(c => c.name === 'Antibiotics')._id,
        basePrice: 12000,
        price: 15000,
        stock: 80,
        expiryDate: new Date('2025-10-01'),
        supplier: 'Pharma Inc.',
      },
      {
        name: 'Cough Syrup 60ml',
        sku: 'CS60',
        category: createdCategories.find(c => c.name === 'Cold & Flu')._id,
        basePrice: 18000,
        price: 22000,
        stock: 60,
        expiryDate: new Date('2026-05-20'),
        supplier: 'Med Solutions',
      },
      {
        name: 'Digital Thermometer',
        sku: 'DT01',
        category: createdCategories.find(c => c.name === 'Medical Devices')._id,
        basePrice: 60000,
        price: 75000,
        stock: 40,
        supplier: 'Med Solutions',
      },
    ];
    
    await Product.insertMany(products);

    console.log('✅ Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();

    console.log('🗑️ Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

// Check for command-line arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}