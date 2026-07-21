const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { ensureAdmin } = require('../middleware/authMiddleware');
const Lawyer = require('../models/Lawyer');
const Appointment = require('../models/Appointment');

// Admin Dashboard
router.get('/dashboard', ensureAdmin, async (req, res) => {
    try {
        const lawyers = await Lawyer.find();
        const appointments = await Appointment.find().populate('userId').populate('lawyerId');
        res.render('admin/dashboard', { lawyers, appointments });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Lawyer Page
router.get('/lawyer/add', ensureAdmin, (req, res) => {
    res.render('admin/add_lawyer', { error: null });
});

// Add Lawyer Action
router.post('/lawyer/add', ensureAdmin, async (req, res) => {
    try {
        const { name, email, password, specialization, experience, location } = req.body;
        const existingLawyer = await Lawyer.findOne({ email });
        
        if (existingLawyer) {
            return res.render('admin/add_lawyer', { error: 'Lawyer email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newLawyer = new Lawyer({
            name, email, password: hashedPassword, specialization, experience, location
        });
        await newLawyer.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.render('admin/add_lawyer', { error: 'Server Error' });
    }
});

// Remove Lawyer
router.post('/lawyer/remove/:id', ensureAdmin, async (req, res) => {
    try {
        await Lawyer.findByIdAndDelete(req.params.id);
        // Cascading delete for appointments related to lawyer could be done here
        await Appointment.deleteMany({ lawyerId: req.params.id });
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
