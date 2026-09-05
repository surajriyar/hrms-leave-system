const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const User = require('./models/User');
const Leave = require('./models/Leave');
const { verifyToken, requireAdmin } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------------- AUTH & PROFILE ROUTES ----------------

// Standard Email/Password Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        empCode: user.empCode || '',
        gender: user.gender || '',
        department: user.department || '',
        designation: user.designation || '',
        costCenter: user.costCenter || '',
        dob: user.dob || '',
        doj: user.doj || ''
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Credential token is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: 'employee'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        empCode: user.empCode || '',
        gender: user.gender || '',
        department: user.department || '',
        designation: user.designation || '',
        costCenter: user.costCenter || '',
        dob: user.dob || '',
        doj: user.doj || ''
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(400).json({ message: 'Google authentication failed' });
  }
});

// Employee: Update Full HRMS Profile
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  const {
    name,
    empCode,
    gender,
    department,
    designation,
    costCenter,
    dob,
    doj,
    password
  } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name.trim();
    user.empCode = empCode || '';
    user.gender = gender || '';
    user.department = department || '';
    user.designation = designation || '';
    user.costCenter = costCenter || '';
    user.dob = dob || '';
    user.doj = doj || '';

    if (password && password.trim().length >= 6) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        empCode: user.empCode,
        gender: user.gender,
        department: user.department,
        designation: user.designation,
        costCenter: user.costCenter,
        dob: user.dob,
        doj: user.doj
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ---------------- LEAVE ROUTES ----------------

// Employee: Apply for leave
app.post('/api/leaves/apply', verifyToken, async (req, res) => {
  const { reason, days } = req.body;

  if (!reason || !days) {
    return res.status(400).json({ message: 'Reason and days are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newLeave = await Leave.create({
      applicant: user._id,
      applicantName: user.name,
      applicantEmail: user.email,
      reason,
      days: Number(days),
      status: 'Pending'
    });

    res.status(201).json(newLeave);
  } catch (error) {
    console.error('Leave Application Error:', error);
    res.status(500).json({ message: 'Failed to submit leave application' });
  }
});

// Employee: View my leaves
app.get('/api/leaves/my', verifyToken, async (req, res) => {
  try {
    const leaves = await Leave.find({ applicant: req.user.id }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    console.error('Fetch My Leaves Error:', error);
    res.status(500).json({ message: 'Failed to retrieve leaves' });
  }
});

// Admin: View all leaves
app.get('/api/leaves/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const allLeaves = await Leave.find().sort({ appliedAt: -1 });
    res.json(allLeaves);
  } catch (error) {
    console.error('Fetch All Leaves Error:', error);
    res.status(500).json({ message: 'Failed to retrieve leave records' });
  }
});

// Admin: Update leave status
app.patch('/api/leaves/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status update' });
  }

  try {
    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({ message: 'Leave record not found' });
    }

    res.json(updatedLeave);
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ message: 'Failed to update leave status' });
  }
});

// ---------------- DATABASE & SERVER INIT ----------------

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected Successfully');

    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (!adminExists) {
      const hashPassword = await bcrypt.hash('123456', 10);
      await User.create([
        { name: 'Admin User', email: 'admin@test.com', password: hashPassword, role: 'admin' },
        { name: 'Employee User', email: 'emp@test.com', password: hashPassword, role: 'employee' }
      ]);
      console.log('Default users created: admin@test.com & emp@test.com (Password: 123456)');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
  });