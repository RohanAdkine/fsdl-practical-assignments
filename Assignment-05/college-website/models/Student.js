const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: [
        'Computer Engineering',
        'Information Technology',
        'Mechanical Engineering',
        'Electronics & Telecommunication',
        'Civil Engineering',
        'Artificial Intelligence & Data Science'
      ]
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Student', studentSchema);
