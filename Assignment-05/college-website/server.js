const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/collegeDB')
  .then(() => console.log(' MongoDB connected to collegeDB'))
  .catch(err => console.error(' MongoDB connection error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Student Model
const Student = require('./models/Student');

// ─── ROUTES ─────────────────────────────────────────────────────────────────

// GET / → Home Page
app.get('/', (req, res) => {
  const news = [
    { title: 'PCCOE Ranked Among Top Engineering Colleges in Pune 2024', date: 'March 1, 2025' },
    { title: 'Placement Drive 2025: Over 500 Students Placed in Top MNCs', date: 'February 20, 2025' },
    { title: 'International Conference on AI & ML to be held at PCCOE', date: 'February 10, 2025' },
    { title: 'PCCOE Students Win National Robotics Championship', date: 'January 28, 2025' },
    { title: 'New Research Lab Inaugurated by Honorable Vice Chancellor', date: 'January 15, 2025' },
  ];
  res.render('home', { news });
});

// GET /about → About Page
app.get('/about', (req, res) => {
  res.render('about');
});

// GET /departments → Departments Page
app.get('/departments', (req, res) => {
  const departments = [
    {
      name: 'Computer Engineering',
      code: 'CE',
      intake: 320,
      established: 1999,
      hod: 'Dr. Sonali Patil',
      description: 'Focuses on software development, algorithms, data structures, AI, ML and modern computing paradigms.',
      icon: '💻'
    },
    {
      name: 'Information Technology',
      code: 'IT',
      intake: 120,
      established: 2001,
      hod: 'Dr. Jayashree V. Katti',
      description: 'Covers web technologies, networking, databases, cloud computing and information systems.',
      icon: '🌐'
    },
    {
      name: 'Mechanical Engineering',
      code: 'MECH',
      intake: 120,
      established: 1999,
      hod: 'Dr. Rajesh Patil',
      description: 'Deals with thermodynamics, fluid mechanics, manufacturing, robotics and industrial automation.',
      icon: '⚙️'
    },
    {
      name: 'Electronics & Telecommunication',
      code: 'ENTC',
      intake: 120,
      established: 1999,
      hod: 'Dr. P. R. Kale',
      description: 'Covers embedded systems, signal processing, VLSI design and communication systems.',
      icon: '📡'
    },
    {
      name: 'Civil Engineering',
      code: 'CIVIL',
      intake: 60,
      established: 2000,
      hod: 'Dr. A.K. Gaikwad',
      description: 'Focuses on structural design, construction management, environmental engineering and surveying.',
      icon: '🏗️'
    },
    {
      name: 'Artificial Intelligence & Data Science',
      code: 'AIDS',
      intake: 60,
      established: 2021,
      hod: 'Dr. Anuradha Thakare',
      description: 'Cutting-edge program covering machine learning, deep learning, big data analytics and AI applications.',
      icon: '🤖'
    }
  ];
  res.render('departments', { departments });
});

// GET /students → Show All Students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.render('students', { students, success: null, error: null });
  } catch (err) {
    console.error(err);
    res.render('students', { students: [], success: null, error: 'Failed to fetch students.' });
  }
});

// GET /addStudent → Add Student Form
app.get('/addStudent', (req, res) => {
  res.render('addStudent', { success: null, error: null });
});

// POST /addStudent → Save Student to DB
app.post('/addStudent', async (req, res) => {
  try {
    const { name, rollNumber, department, year, email } = req.body;

    // Validation
    if (!name || !rollNumber || !department || !year || !email) {
      return res.render('addStudent', {
        success: null,
        error: 'All fields are required. Please fill in the complete form.'
      });
    }

    // Check duplicate roll number
    const existing = await Student.findOne({ rollNumber });
    if (existing) {
      return res.render('addStudent', {
        success: null,
        error: `Roll number ${rollNumber} already exists in the database.`
      });
    }

    const student = new Student({ name, rollNumber, department, year, email });
    await student.save();

    res.render('addStudent', {
      success: `Student "${name}" (Roll No: ${rollNumber}) added successfully!`,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.render('addStudent', {
      success: null,
      error: 'An error occurred while saving student data. Please try again.'
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Start Server
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
  console.log(` College Website is live!`);
});
