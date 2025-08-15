const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: String,
  classes: String,
  username: String,
  password: String
});

module.exports = mongoose.model('Teacher', teacherSchema);
