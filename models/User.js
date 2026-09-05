const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },

  // Naye HRMS Fields
  empCode: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  department: { type: String, default: '' },
  designation: { type: String, default: '' },
  costCenter: { type: String, default: '' },
  dob: { type: String, default: '' },
  doj: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);