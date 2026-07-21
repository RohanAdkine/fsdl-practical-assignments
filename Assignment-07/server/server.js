// ============================================================
// server.js - Main entry point for the Express backend
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────
// Allow cross-origin requests from our React frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
const authRoutes  = require('./routes/auth');
const usageRoutes = require('./routes/usage');

app.use('/api/auth',  authRoutes);   // /api/auth/register  /api/auth/login
app.use('/api/usage', usageRoutes);  // /api/usage  (GET, POST, DELETE)

// ── Root health-check endpoint ──────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Water Usage Tracker API is running 💧' });
});

// ── Connect to MongoDB, then start server ───────────────────
const PORT     = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/water_usage_tracker';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
