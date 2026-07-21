const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');

// GET Login Page
router.get('/login', (req, res) => {
    res.render('auth/login', { error: null });
});

// GET Register Page (For Users)
router.get('/register', (req, res) => {
    res.render('auth/register', { error: null });
});

// POST Register User
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.render('auth/register', { error: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });
        await newUser.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('auth/register', { error: 'Server error during registration' });
    }
});

// POST Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if User or Admin
        let user = await User.findOne({ email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                if (user.role === 'admin') {
                    req.session.admin = user;
                    return res.redirect('/admin/dashboard');
                } else {
                    req.session.user = user;
                    return res.redirect('/user/dashboard');
                }
            } else {
                return res.render('auth/login', { error: 'Invalid credentials' });
            }
        }

        // Check if Lawyer
        let lawyer = await Lawyer.findOne({ email });
        if (lawyer) {
            const isMatch = await bcrypt.compare(password, lawyer.password);
            if (isMatch) {
                req.session.lawyer = lawyer;
                return res.redirect('/lawyer/dashboard');
            } else {
                return res.render('auth/login', { error: 'Invalid credentials' });
            }
        }

        // Not found
        res.render('auth/login', { error: 'User not found' });
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Server error during login' });
    }
});

module.exports = router;
