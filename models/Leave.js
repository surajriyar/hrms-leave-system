const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  reason: { type: String, required: true },
  days: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Leave', leaveSchema);