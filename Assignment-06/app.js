const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET || 'lawyer_booking_secret',
    resave: false,
    saveUninitialized: false
}));

// Set global variables for templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.lawyer = req.session.lawyer || null;
    res.locals.admin = req.session.admin || false;
    next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lawyer_booking')
    .then(() => console.log('MongoDB Connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes Configuration
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/user', require('./routes/user'));
app.use('/lawyer', require('./routes/lawyer'));
app.use('/admin', require('./routes/admin'));

// Basic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
