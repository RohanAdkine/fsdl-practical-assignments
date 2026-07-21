const mongoose = require('mongoose');

const LawyerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    location: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Lawyer', LawyerSchema);
