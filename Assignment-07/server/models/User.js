// ============================================================
// models/User.js - Mongoose schema for a registered user
// ============================================================

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    // User's display name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Must be unique across all users
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Stored as a bcrypt hash – NEVER store plain text passwords!
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
