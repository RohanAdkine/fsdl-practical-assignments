// ============================================================
// routes/usage.js - Water-usage CRUD routes
// All routes are protected – user must be logged in
// ============================================================

const express  = require('express');
const router   = express.Router();
const protect  = require('../middleware/auth');
const { getUsage, addUsage, deleteUsage } = require('../controllers/usageController');

// GET    /api/usage        → fetch all records for logged-in user
router.get('/',     protect, getUsage);

// POST   /api/usage        → add a new record
router.post('/',    protect, addUsage);

// DELETE /api/usage/:id    → delete a specific record
router.delete('/:id', protect, deleteUsage);

module.exports = router;
