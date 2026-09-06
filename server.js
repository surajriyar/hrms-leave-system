const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Google Client Setup
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '781582920391-n1g2a0eud2i0kqchlrbtqjou3ssgln4n.apps.googleusercontent.com';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: String,
  role: { type: String, default: 'employee' },
  empCode: { type: String, default: '3132' },
  gender: { type: String, default: 'Male' },
  department: { type: String, default: 'IT' },
  designation: { type: String, default: 'A.G.M' },
  costCenter: { type: String, default: 'IT' },
  dob: { type: String, default: '1976-04-08' },
  doj: { type: String, default: '2023-01-15' },
  phone: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Leave Schema & Model
const leaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, default: 'CL', enum: ['CL', 'EL', 'CO'] },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] }
}, { timestamps: true });

const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
// Auth Middleware (Routes se pehle hona zaroori hai)
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ================= ROUTES ================= //

// 1. Admin Add Employee Route
app.post('/api/admin/add-employee', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only Admins can add employees.' });
    }

    const { empCode, name, email, department, designation, gender, doj } = req.body;

    if (!empCode || !name) {
      return res.status(400).json({ message: 'Emp Code aur Name zaroori hain!' });
    }

    const cleanCode = empCode.trim().toUpperCase();

    const existing = await User.findOne({ empCode: cleanCode });
    if (existing) {
      return res.status(400).json({ message: `Emp Code ${cleanCode} pehle se registered hai!` });
    }

    const newEmp = new User({
      empCode: cleanCode,
      name,
      email: email || `${cleanCode.toLowerCase()}@company.com`,
      password: cleanCode, // Default password = Emp Code
      role: 'employee',
      department: department || 'IT',
      designation: designation || 'Executive',
      gender: gender || 'Male',
      doj: doj || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    await newEmp.save();
    res.status(201).json({ message: 'Employee successfully add ho gaya!', employee: newEmp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Fetch All Employees Directory
app.get('/api/admin/employees', auth, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

// 1. Emp Code Login Route
app.post('/api/auth/login-emp', async (req, res) => {
  try {
    const { empCode, password, role } = req.body;
    const cleanCode = (empCode || '').trim().toUpperCase();

    // 👉 HARDCODED ADMIN BYPASS (Koi database check nahi, seedha Login)
    if (role === 'admin' || cleanCode === 'ADMIN') {
      const adminToken = jwt.sign(
        { id: 'admin_root_123', empCode: 'ADMIN', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token: adminToken,
        user: {
          id: 'admin_root_123',
          name: 'System Administrator',
          email: 'admin@company.com',
          empCode: 'ADMIN',
          role: 'admin',
          department: 'Management',
          designation: 'System Admin'
        }
      });
    }

    // Regular Employee Flow
    let user = await User.findOne({ empCode: cleanCode });
    if (!user) {
      user = new User({
        name: 'Mr RAJ SANDEEP SINGH',
        email: `${cleanCode.toLowerCase()}@company.com`,
        empCode: cleanCode,
        password: cleanCode,
        role: 'employee',
        department: 'IT',
        designation: 'A.G.M'
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, empCode: user.empCode, role: 'employee' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        empCode: user.empCode,
        role: 'employee',
        department: user.department,
        designation: user.designation
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Change Password Route
app.put('/api/auth/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const currentPassword = user.password || user.empCode;
    if (oldPassword !== currentPassword) {
      return res.status(400).json({ message: 'Old password galat hai' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password successfully change ho gaya!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 1. Google Auth Route
app.post('/api/auth/google', async (req, res) => {
  try {
    const idToken = req.body.token || req.body.credential;
    if (!idToken) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        picture,
        role: email.includes('admin') ? 'admin' : 'employee'
      });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token: jwtToken,
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
        doj: user.doj,
        phone: user.phone,
        picture: user.picture
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    return res.status(400).json({ message: 'Invalid Google Token', error: err.message });
  }
});

// 2. Profile Update Route
app.put('/api/auth/profile', auth, async (req, res) => {
  try {
    const { department, phone, designation, picture } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { department, phone, designation, picture },
      { new: true }
    );
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Add New Employee Route
app.post('/api/admin/add-employee', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { empCode, name, email, department, designation, gender, doj } = req.body;

    if (!empCode || !name) {
      return res.status(400).json({ message: 'Emp Code aur Name zaroori hain' });
    }

    const cleanCode = empCode.trim().toUpperCase();

    // Check duplicate
    const existing = await User.findOne({ empCode: cleanCode });
    if (existing) {
      return res.status(400).json({ message: 'Yeh Emp Code pehle se registered hai!' });
    }

    const newEmp = new User({
      empCode: cleanCode,
      name,
      email: email || `${cleanCode.toLowerCase()}@company.com`,
      password: cleanCode, // Default password = Emp Code
      role: 'employee',
      department: department || 'IT',
      designation: designation || 'Executive',
      gender: gender || 'Male',
      doj: doj || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    await newEmp.save();
    res.status(201).json({ message: 'Employee successfully add ho gaya!', employee: newEmp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Apply Leave Route
app.post('/api/leaves/apply', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const newLeave = new Leave({
      user: req.user.id,
      leaveType: leaveType || 'CL',
      startDate,
      endDate,
      reason
    });
    await newLeave.save();
    res.status(201).json(newLeave);
  } catch (err) {
    res.status(500).json({ message: 'Failed to apply leave' });
  }
});

// 4. My Leaves Route
app.get('/api/leaves/my', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. Admin: All Leaves Route
app.get('/api/leaves/all', auth, async (req, res) => {
  try {
    const leaves = await Leave.find().populate('user', 'name email department').sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. Admin: Update Leave Status
app.put('/api/leaves/status/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



// DB Connection & Server Start
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB Connection Error:', err));