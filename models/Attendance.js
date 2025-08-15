// models/attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  reg: { type: String, required: true },
  name: { type: String, required: true },
  classes: { type: String, required: true },
  status: { type: Boolean, required: true },
  date: { type: String, required: true }, // store date as YYYY-MM-DD string
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
