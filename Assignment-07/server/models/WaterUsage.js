// ============================================================
// models/WaterUsage.js - Mongoose schema for a water-usage record
// ============================================================

const mongoose = require('mongoose');

const WaterUsageSchema = new mongoose.Schema(
  {
    // Reference to the user who created this record
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Water consumed in litres (e.g. 2.5)
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.1, 'Amount must be at least 0.1 litres'],
    },

    // One of three predefined categories
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Drinking', 'Cooking', 'Bathing'],
    },

    // The calendar date this usage occurred on
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

module.exports = mongoose.model('WaterUsage', WaterUsageSchema);
