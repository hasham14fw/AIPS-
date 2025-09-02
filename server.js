// ===== Imports =====
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

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

    // Ensure attendance uniqueness on reg + date
    await db.collection('attendances').createIndex({ reg: 1, date: 1 }, { unique: true });

    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
}
connectDB();

// ===== JWT Middlewares =====
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

function authenticateTeacher(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    if (!decoded.reg || !decoded.classes) return res.status(403).json({ error: 'Not authorized as teacher' });
    req.teacher = decoded;
    next();
  });
}

// ===== Auth Routes =====
// Student Login
app.post('/login', async (req, res) => {
  const { reg, password } = req.body;
  const student = await db.collection('students').findOne({ reg });
  if (!student || !(await bcrypt.compare(password, student.password))) {
    return res.status(401).json({ error: 'Invalid registration number or password' });
  }
  const token = jwt.sign({ reg: student.reg }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Teacher Login
app.post('/teacher-login', async (req, res) => {
  const { reg, password } = req.body;
  const teacher = await db.collection('teachers').findOne({ reg });
  if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
    return res.status(401).json({ error: 'Invalid registration number or password' });
  }
  const token = jwt.sign({ reg: teacher.reg, classes: teacher.classes }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// ===== Student & Teacher Info =====
app.get('/student', authenticateToken, async (req, res) => {
  const student = await db.collection('students').findOne({ reg: req.user.reg });
  if (!student) return res.status(404).json({ error: 'Student not found' });
  delete student.password;
  res.json(student);
});

app.get('/teacher', authenticateToken, async (req, res) => {
  const teacher = await db.collection('teachers').findOne({ reg: req.user.reg });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  delete teacher.password;
  res.json(teacher);
});

// ===== Results & News =====
app.get('/result', async (req, res) => {
  const reg = req.query.reg?.toString();
  if (!reg) return res.status(400).json({ error: 'Missing registration number' });
  const result = await db.collection('detailedResults').find({ reg }).sort({ examDate: -1 }).limit(1).toArray();
  if (!result.length) return res.status(404).json({ content: 'Result not found' });
  const student = await db.collection('students').findOne({ reg });
  result[0].fname = student?.fname || 'N/A';
  result[0].fatherName = student?.fatherName || 'N/A';
  res.json(result[0]);
});

app.get('/latest-news', async (req, res) => {
  const news = await db.collection('news').find().sort({ date: -1 }).limit(1).toArray();
  if (!news.length) return res.status(404).json({ content: "No news available." });
  res.json({ content: news[0].content });
});

// ===== Admission Form =====
app.post('/apply', async (req, res) => {
  try {
    const { name, fname, contact, school, classApplied, address } = req.body;

    console.log("📩 Incoming /apply request:", req.body); // log request body

    if (!name || !fname || !contact || !school || !classApplied || !address) {
      return res.status(400).json({ error: 'All fields are required' });
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

    console.log("✅ Insert result:", result); // log DB response

    return res.status(201).json({ message: 'Application submitted successfully!' });
  } catch (err) {
    console.error("❌ Error in /apply:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

// ===== Students by Teacher Class =====
app.get('/api/students', authenticateTeacher, async (req, res) => {
  const teacherClass = req.teacher.classes;
  try {
    const students = await db.collection('students').find({ classes: teacherClass }).toArray();
    const trimmed = students.map(({ name, reg, classes }) => ({ name, reg, classes }));
    res.json(trimmed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// ===== Attendance =====
app.post("/api/attendance", authenticateTeacher, async (req, res) => {
  try {
    const attendance = req.body.attendance;
    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ error: "Invalid attendance data" });
    }

    const today = new Date().toISOString().split("T")[0];
    let insertedCount = 0;
    let skippedCount = 0;

    for (const student of attendance) {
      try {
        await db.collection("attendances").insertOne({
          reg: student.reg,
          name: student.name,
          classes: req.teacher.classes,
          status: student.status === true,
          date: today,
        });
        insertedCount++;
      } catch (err) {
        if (err.code === 11000) {
          skippedCount++;
          continue; // already exists for today
        } else {
          throw err;
        }
      }
    }

    res.json({
      message: `Attendance submitted. ${insertedCount} new record(s), ${skippedCount} skipped (already marked).`,
    });
  } catch (err) {
    console.error("Error submitting attendance:", err);
    res.status(500).json({ error: "Error submitting attendance" });
  }
});

// ===== Get Current Month Attendance for Student =====
app.get('/api/student-attendance', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // "01".."12"
    const currentMonthPrefix = `${year}-${month}`;

    const attendance = await db.collection('attendances')
      .find({
        reg: req.user.reg,
        date: { $regex: `^${currentMonthPrefix}` }
      })
      .sort({ date: -1 })
      .toArray();

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== Student Results (all) =====
app.get('/results', authenticateToken, async (req, res) => {
  try {
    const reg = req.user.reg;
    const results = await db.collection('detailedResults').find({ reg: reg.toString() }).sort({ examDate: -1 }).toArray();
    if (!results.length) return res.status(404).json({ error: 'No results found' });
    res.json(results);
  } catch (error) {
    console.error('[GET /results] Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== Start Server =====
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
