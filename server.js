// ===== Imports =====
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
});



// app.get('/', (req, res) => {
//   res.send('Server is up and running ✅');
// });

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ===== MongoDB Setup =====
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('AIPS');
    console.log('✅ Connected');

    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'AIPS' });


  } catch (err) {
    console.error('❌connection failed:', err);
  }
}
connectDB();

// ===== Models (Mongoose) =====
const attendanceSchema = new mongoose.Schema({
  reg: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  classes: { type: String, required: true },
  attendance: [
    {
      date: { type: String, required: true }, // YYYY-MM-DD
      status: { type: Boolean, required: true }
    }
  ]
});


//const Attendance = mongoose.model('Attendance', attendanceSchema);

// ===== JWT Middleware =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ===== Teacher Auth Middleware =====
function verifyTeacher(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    if (!user.teacherClass) return res.status(403).json({ error: 'Teacher access required' });
    req.user = user;
    next();
  });
}

// ===== Routes =====

// ✅ Student Login
app.post('/login', async (req, res) => {
  const { reg, password } = req.body;
  const student = await db.collection('students').findOne({ reg });

  if (!student || !(await bcrypt.compare(password, student.password))) {
    return res.status(401).json({ error: 'Invalid registration number or password' });
  }

  const token = jwt.sign({ reg: student.reg }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// ✅ Teacher Login
app.post('/teacher-login', async (req, res) => {
  const { reg, password } = req.body;
  const teacher = await db.collection('teachers').findOne({ reg });

  if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
    return res.status(401).json({ error: 'Invalid registration number or password' });
  }

  const token = jwt.sign(
    { reg: teacher.reg, teacherClass: teacher.classes },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token });
});

// ✅ Get Student Info
app.get('/student', authenticateToken, async (req, res) => {
  const student = await db.collection('students').findOne({ reg: req.user.reg });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  delete student.password;
  res.json(student);
});

// ✅ Get Teacher Info
app.get('/teacher', authenticateToken, async (req, res) => {
  const teacher = await db.collection('teachers').findOne({ reg: req.user.reg });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  delete teacher.password;
  res.json(teacher);
});

// ✅ Get Latest Result
app.get('/result', async (req, res) => {
  const reg = req.query.reg?.toString();
  if (!reg) return res.status(400).json({ error: 'Missing registration number' });

  const result = await db.collection('detailedResults')
    .find({ reg }).sort({ examDate: -1 }).limit(1).toArray();

  if (!result.length) return res.status(404).json({ content: 'Result not found' });

  const student = await db.collection('students').findOne({ reg });
  result[0].fname = student?.fname || 'N/A';
  result[0].fatherName = student?.fatherName || 'N/A';

  res.json(result[0]);
});

// ✅ Get Latest News
app.get('/latest-news', async (req, res) => {
  const news = await db.collection('news').find().sort({ date: -1 }).limit(1).toArray();
  if (!news.length) return res.status(404).json({ content: "No news available." });

  res.json({ content: news[0].content });
});

// ✅ Submit Admission Form
// ===== Submit Admission Form =====
app.post('/apply', async (req, res) => {
  try {
    const { name, fname, contact, school, classApplied, address } = req.body;

    if (!name || !fname || !contact || !school || !classApplied || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!db) {
      console.error("❌ Database not connected yet");
      return res.status(500).json({ error: 'Database not connected' });
    }

    const result = await db.collection('admission').insertOne({
      name,
      fname,
      contact,
      school,
      classApplied,
      address,
      date: new Date()
    });

    if (!result.insertedId) {
      console.error("❌ Insert failed", result);
      return res.status(500).json({ error: 'Failed to save application' });
    }

    res.status(201).json({ message: 'Application submitted successfully!' });
  } catch (err) {
    console.error("❌ Error in /apply route:", err);
    res.status(500).json({ error: 'Server error while submitting application' });
  }
});


// ✅ Submit Attendance (per student document)
app.post('/api/attendance', async (req, res) => {
    try {
        const { attendance } = req.body;

        if (!attendance || !Array.isArray(attendance)) {
            return res.status(400).json({ error: 'Invalid attendance data' });
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        let insertedCount = 0;

        for (const record of attendance) {
            // Check if attendance already exists for this student today
            const exists = await Attendance.findOne({
                reg: record.reg,
                date: today
            });

            if (!exists) {
                await Attendance.create({
                    reg: record.reg,
                    name: record.name,
                    classes: record.classes,
                    status: record.status,
                    date: today
                });
                insertedCount++;
            }
        }

        res.json({
            message: `Attendance submitted successfully. ${insertedCount} new record(s) added.`
        });
    } catch (error) {
        console.error('Error submitting attendance:', error);
        res.status(500).json({ error: 'Error submitting attendance' });
    }
});


// server.js
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});



// ✅ Get Students by Class (SECURE)
app.get('/api/students', authenticateToken, async (req, res) => {
  const teacherClass = req.user.teacherClass;
  if (!teacherClass) return res.status(400).json({ error: 'Unauthorized access' });

  try {
    const students = await db.collection('students').find({ classes: teacherClass }).toArray();
    const trimmed = students.map(({ name, reg, classes }) => ({ name, reg, classes }));
    res.json(trimmed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});



// ✅ Get Current Month Attendance for Student
app.get('/api/student-attendance', authenticateToken, async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // "01".."12"

        const currentMonthPrefix = `${year}-${month}`; // e.g. "2025-08"

        const attendance = await db.collection('attendances')
            .find({
                reg: req.user.reg,
                date: { $regex: `^${currentMonthPrefix}` } // starts with YYYY-MM
            })
            .sort({ date: -1 })
            .toArray();

        res.json(attendance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// GET latest exam result for a student by rollNumber (or reg)
app.get('/results', authenticateToken, async (req, res) => {
  try {
    const reg = req.user.reg;
    console.log('[GET /results] Token reg:', reg);

    if (!reg) {
      return res.status(400).json({ error: 'Registration number missing in token' });
    }

    // Ensure reg is string (just in case)
    const regStr = reg.toString();

    // Query detailedResults collection for matching reg
    const results = await db.collection('detailedResults')
      .find({ reg: regStr })
      .sort({ examDate: -1 })
      .toArray();

    console.log('[GET /results] Found results count:', results.length);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No results found' });
    }

    res.json(results);
  } catch (error) {
    console.error('[GET /results] Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});