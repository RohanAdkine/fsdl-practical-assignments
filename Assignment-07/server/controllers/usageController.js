// ============================================================
// controllers/usageController.js
// CRUD operations for water-usage records
// ============================================================

const WaterUsage = require('../models/WaterUsage');

// ── GET /api/usage ──────────────────────────────────────────
// Returns ALL records for the currently logged-in user
const getUsage = async (req, res) => {
  try {
    // req.user.id is set by the auth middleware
    const records = await WaterUsage.find({ user: req.user.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error('Get usage error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── POST /api/usage ─────────────────────────────────────────
// Creates a new water-usage record for the logged-in user
const addUsage = async (req, res) => {
  try {
    const { amount, category, date } = req.body;

    // Validate input
    if (!amount || !category || !date) {
      return res.status(400).json({ message: 'Amount, category, and date are required.' });
    }

    const record = await WaterUsage.create({
      user: req.user.id,
      amount,
      category,
      date,
    });

    res.status(201).json({ message: 'Record added!', record });
  } catch (err) {
    console.error('Add usage error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── DELETE /api/usage/:id ───────────────────────────────────
// Deletes a record – only the owner can delete their own records
const deleteUsage = async (req, res) => {
  try {
    const record = await WaterUsage.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    // Security check: make sure the record belongs to the logged-in user
    if (record.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised to delete this record.' });
    }

    await record.deleteOne();
    res.json({ message: 'Record deleted successfully.' });
  } catch (err) {
    console.error('Delete usage error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getUsage, addUsage, deleteUsage };
