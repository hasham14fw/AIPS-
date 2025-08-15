const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  reg: String,
  fname: String,
  classes: String,
  password: String
});

module.exports = mongoose.model('Student', studentSchema);
