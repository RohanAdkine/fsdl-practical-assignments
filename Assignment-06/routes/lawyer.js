const express = require('express');
const router = express.Router();
const { ensureLawyer } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');

// Lawyer Dashboard
router.get('/dashboard', ensureLawyer, async (req, res) => {
    try {
        const appointments = await Appointment.find({ lawyerId: req.session.lawyer._id }).populate('userId');
        res.render('lawyer/dashboard', { lawyer: req.session.lawyer, appointments });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update Appointment Status
router.post('/appointment/:id', ensureLawyer, async (req, res) => {
    try {
        const { status } = req.body;
        await Appointment.findByIdAndUpdate(req.params.id, { status });
        res.redirect('/lawyer/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
