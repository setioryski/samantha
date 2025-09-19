const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // <-- Important for resolving file paths
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/adjustments', require('./routes/adjustmentRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));
app.use('/api/therapists', require('./routes/therapistRoutes')); // <-- Add this line

// --- Production Deployment Logic ---
if (process.env.NODE_ENV === 'production') {
  // Get the correct directory path
  const __dirname = path.resolve();
  // Set the static folder
  app.use(express.static(path.join(__dirname, '/client/dist')));

  // Serve the index.html file for all other routes
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('Apothecary POS API is running in development mode...');
  });
}
// ------------------------------------

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));