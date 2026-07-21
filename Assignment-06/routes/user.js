const express = require('express');
const router = express.Router();
const { ensureUser } = require('../middleware/authMiddleware');
const Lawyer = require('../models/Lawyer');
const Appointment = require('../models/Appointment');

// User Dashboard
router.get('/dashboard', ensureUser, async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.session.user._id }).populate('lawyerId');
        res.render('user/dashboard', { user: req.session.user, appointments });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// View all Lawyers
router.get('/lawyers', ensureUser, async (req, res) => {
    try {
        const lawyers = await Lawyer.find();
        res.render('user/lawyers', { lawyers });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Booking Page for a specific Lawyer
router.get('/book/:lawyerId', ensureUser, async (req, res) => {
    try {
        const lawyer = await Lawyer.findById(req.params.lawyerId);
        if (!lawyer) return res.status(404).send('Lawyer not found');
        res.render('user/book', { lawyer });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Submit Booking
router.post('/book/:lawyerId', ensureUser, async (req, res) => {
    try {
        const { date, time } = req.body;
        const newAppointment = new Appointment({
            userId: req.session.user._id,
            lawyerId: req.params.lawyerId,
            date,
            time
        });
        await newAppointment.save();
        res.redirect('/user/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Cancel Appointment
router.post('/cancel/:appointmentId', ensureUser, async (req, res) => {
    try {
        await Appointment.findByIdAndDelete(req.params.appointmentId);
        res.redirect('/user/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
