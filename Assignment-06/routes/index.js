const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../middleware/authMiddleware');

// Home page
router.get('/', forwardAuthenticated, (req, res) => {
    res.render('home');
});

// Logout handles all users
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect('/');
    });
});

module.exports = router;
