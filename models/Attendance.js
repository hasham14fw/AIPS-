const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  reg: { type: String, required: true },
  name: { type: String, required: true },
  class: { type: String, required: true },
  status: { type: Boolean, required: true },
  date: {
    type: String,
    default: () => new Date().toISOString().split("T")[0] // YYYY-MM-DD
  }
});

// Force mongoose to use "attendances" collection
module.exports = mongoose.model("Attendance", attendanceSchema, "attendances");
