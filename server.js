const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors({ origin: '*' }));

app.use(
  express.json({
    limit: '10mb'
  })
);

// =====================================================
// CONFIGURATION
// =====================================================

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '781582920391-n1g2a0eud2i0kqchlrbtqjou3ssgln4n.apps.googleusercontent.com';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your_super_secret_jwt_key_123';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/hrms';

const PORT =
  process.env.PORT || 5000;

const googleClient =
  new OAuth2Client(GOOGLE_CLIENT_ID);

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      default: ''
    },

    picture: {
      type: String,
      default: ''
    },

    role: {
      type: String,
      enum: ['employee', 'admin'],
      default: 'employee'
    },

    empCode: {
      type: String,
      default: '3132',
      trim: true
    },

    gender: {
      type: String,
      default: 'Male'
    },

    department: {
      type: String,
      default: 'IT'
    },

    designation: {
      type: String,
      default: 'A.G.M'
    },

    costCenter: {
      type: String,
      default: 'IT'
    },

    dob: {
      type: String,
      default: '1976-04-08'
    },

    doj: {
      type: String,
      default: '2023-01-15'
    },

    phone: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const User =
  mongoose.models.User ||
  mongoose.model('User', userSchema);

// =====================================================
// LEAVE SCHEMA
// =====================================================

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    leaveType: {
      type: String,
      enum: [
        'CL',
        'SL',
        'EL',
        'LWP',
        'CO'
      ],
      default: 'CL'
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        'Pending',
        'Approved',
        'Rejected'
      ],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

const Leave =
  mongoose.models.Leave ||
  mongoose.model('Leave', leaveSchema);

// =====================================================
// LEAVE POLICY SCHEMA
// =====================================================

const leavePolicySchema =
  new mongoose.Schema(
    {
      year: {
        type: Number,
        required: true,
        unique: true
      },

      CL: {
        type: Number,
        default: 7,
        min: 0
      },

      SL: {
        type: Number,
        default: 7,
        min: 0
      },

      EL: {
        type: Number,
        default: 7,
        min: 0
      },

      LWP: {
        type: Number,
        default: 7,
        min: 0
      },

      CO: {
        type: Number,
        default: 7,
        min: 0
      }
    },
    {
      timestamps: true
    }
  );

const LeavePolicy =
  mongoose.models.LeavePolicy ||
  mongoose.model(
    'LeavePolicy',
    leavePolicySchema
  );

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const auth = (req, res, next) => {
  const token = req
    .header('Authorization')
    ?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      message:
        'No token, authorization denied'
    });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message:
        'Token is not valid'
    });
  }
};

// =====================================================
// ADMIN MIDDLEWARE
// =====================================================

const adminOnly = (
  req,
  res,
  next
) => {
  if (
    !req.user ||
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      message:
        'Access denied. Admin only.'
    });
  }

  next();
};

// =====================================================
// CONSTANTS
// =====================================================

const LEAVE_TYPES = [
  'CL',
  'SL',
  'EL',
  'LWP',
  'CO'
];

const DEFAULT_LEAVE_LIMITS = {
  CL: 7,
  SL: 7,
  EL: 7,
  LWP: 7,
  CO: 7
};

// =====================================================
// HELPER - DATE ONLY
// =====================================================

const parseDateOnly = (
  dateValue
) => {
  if (
    typeof dateValue !== 'string'
  ) {
    return null;
  }

  const parts =
    dateValue.split('-');

  if (parts.length !== 3) {
    return null;
  }

  const year =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const day =
    Number(parts[2]);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

// =====================================================
// HELPER - CALCULATE INCLUSIVE DAYS
// =====================================================

const calculateLeaveDays = (
  startDate,
  endDate
) => {
  let start;
  let end;

  if (
    typeof startDate === 'string'
  ) {
    start =
      parseDateOnly(startDate);
  } else {
    start =
      new Date(startDate);

    if (!isNaN(start.getTime())) {
      start =
        new Date(
          Date.UTC(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
          )
        );
    }
  }

  if (
    typeof endDate === 'string'
  ) {
    end =
      parseDateOnly(endDate);
  } else {
    end =
      new Date(endDate);

    if (!isNaN(end.getTime())) {
      end =
        new Date(
          Date.UTC(
            end.getFullYear(),
            end.getMonth(),
            end.getDate()
          )
        );
    }
  }

  if (!start || !end) {
    return 0;
  }

  const difference =
    end.getTime() -
    start.getTime();

  if (difference < 0) {
    return 0;
  }

  return (
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
};

// =====================================================
// HELPER - GET CURRENT POLICY
// =====================================================

const getCurrentLeavePolicy =
  async () => {
    const year =
      new Date().getFullYear();

    let policy =
      await LeavePolicy.findOne({
        year
      });

    if (!policy) {
      policy =
        await LeavePolicy.create({
          year,
          ...DEFAULT_LEAVE_LIMITS
        });
    }

    return policy;
  };

// =====================================================
// HELPER - GET LEAVE BALANCE
// =====================================================

const getEmployeeLeaveBalance =
  async (
    userId,
    policy
  ) => {
    const year =
      policy.year;

    const yearStart =
      new Date(
        year,
        0,
        1
      );

    const yearEnd =
      new Date(
        year + 1,
        0,
        1
      );

    const leaves =
      await Leave.find({
        user: userId,

        status: {
          $in: [
            'Pending',
            'Approved'
          ]
        },

        $or: [
          {
            startDate: {
              $lt: yearEnd
            },

            endDate: {
              $gte: yearStart
            }
          }
        ]
      });

    const balance = {};

    for (
      const type of LEAVE_TYPES
    ) {
      const allowed =
        Number(
          policy[type] ?? 0
        );

      let used = 0;

      leaves
        .filter(
          (leave) =>
            leave.leaveType ===
            type
        )
        .forEach(
          (leave) => {
            used +=
              calculateLeaveDays(
                leave.startDate,
                leave.endDate
              );
          }
        );

      balance[type] = {
        allowed,
        used,
        remaining:
          Math.max(
            allowed - used,
            0
          )
      };
    }

    return balance;
  };

// =====================================================
// AUTH - EMPLOYEE CODE LOGIN
// =====================================================

app.post(
  '/api/auth/login-emp',
  async (req, res) => {
    try {
      const {
        empCode,
        password,
        role
      } = req.body;

      const cleanCode =
        (empCode || '')
          .trim()
          .toUpperCase();

      // -------------------------------------------------
      // ADMIN LOGIN
      // -------------------------------------------------

      if (
        role === 'admin' ||
        cleanCode === 'ADMIN'
      ) {
        const adminToken =
          jwt.sign(
            {
              id:
                'admin_root_123',

              empCode:
                'ADMIN',

              role:
                'admin'
            },

            JWT_SECRET,

            {
              expiresIn:
                '7d'
            }
          );

        return res.json({
          token:
            adminToken,

          user: {
            id:
              'admin_root_123',

            name:
              'System Administrator',

            email:
              'admin@company.com',

            empCode:
              'ADMIN',

            role:
              'admin',

            department:
              'Management',

            designation:
              'System Admin',

            phone:
              '',

            picture:
              ''
          }
        });
      }

      // -------------------------------------------------
      // EMPLOYEE LOGIN
      // -------------------------------------------------

      if (!cleanCode) {
        return res.status(400).json({
          message:
            'Employee Code required'
        });
      }

      let user =
        await User.findOne({
          empCode:
            cleanCode
        });

      // Existing employee
      if (user) {
        const currentPassword =
          user.password ||
          user.empCode;

        if (
          password !==
            undefined &&
          password !==
            currentPassword
        ) {
          return res.status(401).json({
            message:
              'Invalid password'
          });
        }
      }

      // Create employee if not found
      if (!user) {
        user =
          new User({
            name:
              'Mr RAJ SANDEEP SINGH',

            email:
              `${cleanCode.toLowerCase()}@company.com`,

            empCode:
              cleanCode,

            password:
              cleanCode,

            role:
              'employee',

            department:
              'IT',

            designation:
              'A.G.M'
          });

        await user.save();
      }

      const token =
        jwt.sign(
          {
            id:
              user._id,

            empCode:
              user.empCode,

            role:
              'employee'
          },

          JWT_SECRET,

          {
            expiresIn:
              '7d'
          }
        );

      return res.json({
        token,

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          empCode:
            user.empCode,

          role:
            user.role,

          gender:
            user.gender,

          department:
            user.department,

          designation:
            user.designation,

          costCenter:
            user.costCenter,

          dob:
            user.dob,

          doj:
            user.doj,

          phone:
            user.phone,

          picture:
            user.picture
        }
      });
    } catch (err) {
      console.error(
        'Employee Login Error:',
        err
      );

      return res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);

// =====================================================
// GOOGLE AUTH
// =====================================================

app.post(
  '/api/auth/google',
  async (req, res) => {
    try {
      const idToken =
        req.body.token ||
        req.body.credential;

      if (!idToken) {
        return res.status(400).json({
          message:
            'Token is required'
        });
      }

      const ticket =
        await googleClient.verifyIdToken({
          idToken,
          audience:
            GOOGLE_CLIENT_ID
        });

      const payload =
        ticket.getPayload();

      const {
        email,
        name,
        picture
      } = payload;

      let user =
        await User.findOne({
          email
        });

      if (!user) {
        user =
          new User({
            name:
              name ||
              'Google User',

            email,

            picture:
              picture || '',

            role:
              email
                ?.toLowerCase()
                .includes('admin')
                ? 'admin'
                : 'employee'
          });

        await user.save();
      }

      const jwtToken =
        jwt.sign(
          {
            id:
              user._id,

            email:
              user.email,

            role:
              user.role
          },

          JWT_SECRET,

          {
            expiresIn:
              '7d'
          }
        );

      return res.json({
        token:
          jwtToken,

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          empCode:
            user.empCode,

          gender:
            user.gender,

          department:
            user.department,

          designation:
            user.designation,

          costCenter:
            user.costCenter,

          dob:
            user.dob,

          doj:
            user.doj,

          phone:
            user.phone,

          picture:
            user.picture
        }
      });
    } catch (err) {
      console.error(
        'Google Auth Error:',
        err.message
      );

      return res.status(400).json({
        message:
          'Invalid Google Token',

        error:
          err.message
      });
    }
  }
);

// =====================================================
// CHANGE PASSWORD
// =====================================================

app.put(
  '/api/auth/change-password',
  auth,
  async (req, res) => {
    try {
      const {
        oldPassword,
        newPassword
      } = req.body;

      if (
        !oldPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            'Old password and new password are required'
        });
      }

      // Admin
      if (
        req.user.role ===
          'admin' &&
        req.user.id ===
          'admin_root_123'
      ) {
        return res.status(400).json({
          message:
            'Admin password is managed separately.'
        });
      }

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            'User not found'
        });
      }

      const currentPassword =
        user.password ||
        user.empCode;

      if (
        oldPassword !==
        currentPassword
      ) {
        return res.status(400).json({
          message:
            'Old password galat hai'
        });
      }

      user.password =
        newPassword;

      await user.save();

      return res.json({
        message:
          'Password successfully change ho gaya!'
      });
    } catch (err) {
      console.error(
        'Change Password Error:',
        err
      );

      return res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);

// =====================================================
// PROFILE UPDATE
// =====================================================

app.put(
  '/api/auth/profile',
  auth,
  async (req, res) => {
    try {
      const {
        name,
        department,
        phone,
        designation,
        picture,
        costCenter,
        dob
      } = req.body;

      // -------------------------------------------------
      // HARD-CODED ADMIN PROFILE
      // -------------------------------------------------

      if (
        req.user.role ===
          'admin' &&
        req.user.id ===
          'admin_root_123'
      ) {
        const adminUser = {
          id:
            'admin_root_123',

          name:
            name?.trim() ||
            'System Administrator',

          email:
            'admin@company.com',

          empCode:
            'ADMIN',

          role:
            'admin',

          department:
            department ||
            'Management',

          designation:
            designation ||
            'System Admin',

          phone:
            phone || '',

          picture:
            picture || ''
        };

        return res.json({
          message:
            'Admin profile updated successfully',

          user:
            adminUser
        });
      }

      // -------------------------------------------------
      // DATABASE USER
      // -------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            'User not found'
        });
      }

      if (
        name !== undefined
      ) {
        if (!name.trim()) {
          return res.status(400).json({
            message:
              'Name cannot be empty'
          });
        }

        user.name =
          name.trim();
      }

      if (
        department !==
        undefined
      ) {
        user.department =
          department;
      }

      if (
        phone !== undefined
      ) {
        user.phone =
          phone;
      }

      if (
        designation !==
        undefined
      ) {
        user.designation =
          designation;
      }

      if (
        picture !== undefined
      ) {
        user.picture =
          picture;
      }

      if (
        costCenter !==
        undefined
      ) {
        user.costCenter =
          costCenter;
      }

      if (
        dob !== undefined
      ) {
        user.dob =
          dob;
      }

      await user.save();

      return res.json({
        message:
          'Profile updated successfully',

        user
      });
    } catch (err) {
      console.error(
        'Profile Update Error:',
        err
      );

      return res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);

// =====================================================
// ADMIN - ADD EMPLOYEE
// =====================================================

app.post(
  '/api/admin/add-employee',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const {
        empCode,
        name,
        email,
        department,
        designation,
        gender,
        doj
      } = req.body;

      if (
        !empCode ||
        !name
      ) {
        return res.status(400).json({
          message:
            'Emp Code aur Name zaroori hain'
        });
      }

      const cleanCode =
        empCode
          .trim()
          .toUpperCase();

      const existingByCode =
        await User.findOne({
          empCode:
            cleanCode
        });

      if (existingByCode) {
        return res.status(400).json({
          message:
            `Emp Code ${cleanCode} pehle se registered hai!`
        });
      }

      if (email) {
        const existingByEmail =
          await User.findOne({
            email:
              email.trim()
          });

        if (existingByEmail) {
          return res.status(400).json({
            message:
              'Yeh email pehle se registered hai!'
          });
        }
      }

      const newEmp =
        new User({
          empCode:
            cleanCode,

          name:
            name.trim(),

          email:
            email?.trim() ||
            `${cleanCode.toLowerCase()}@company.com`,

          password:
            cleanCode,

          role:
            'employee',

          department:
            department ||
            'IT',

          designation:
            designation ||
            'Executive',

          gender:
            gender ||
            'Male',

          doj:
            doj ||
            new Date()
              .toISOString()
              .split('T')[0]
        });

      await newEmp.save();

      return res.status(201).json({
        message:
          'Employee successfully add ho gaya!',

        employee:
          newEmp
      });
    } catch (err) {
      console.error(
        'Add Employee Error:',
        err
      );

      return res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);

// =====================================================
// ADMIN - FETCH ALL EMPLOYEES
// =====================================================

app.get(
  '/api/admin/employees',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const employees =
        await User.find({
          role:
            'employee'
        }).sort({
          createdAt:
            -1
        });

      return res.json(
        employees
      );
    } catch (err) {
      console.error(
        'Fetch Employees Error:',
        err
      );

      return res.status(500).json({
        message:
          'Failed to fetch employees'
      });
    }
  }
);

// =====================================================
// EMPLOYEE - APPLY LEAVE
// =====================================================

app.post(
  '/api/leaves/apply',
  auth,
  async (req, res) => {
    try {
      // Admin cannot apply
      if (
        req.user.role ===
        'admin'
      ) {
        return res.status(403).json({
          message:
            'Admin account cannot apply leave.'
        });
      }

      const {
        leaveType,
        startDate,
        endDate,
        reason
      } = req.body;

      if (
        !leaveType ||
        !startDate ||
        !endDate ||
        !reason?.trim()
      ) {
        return res.status(400).json({
          message:
            'Leave type, start date, end date and reason are required.'
        });
      }

      // Validate leave type
      if (
        !LEAVE_TYPES.includes(
          leaveType
        )
      ) {
        return res.status(400).json({
          message:
            'Invalid leave type.'
        });
      }

      // Parse date-only values
      const start =
        parseDateOnly(
          startDate
        );

      const end =
        parseDateOnly(
          endDate
        );

      if (!start || !end) {
        return res.status(400).json({
          message:
            'Invalid leave dates.'
        });
      }

      if (
        end.getTime() <
        start.getTime()
      ) {
        return res.status(400).json({
          message:
            'End date cannot be before start date.'
        });
      }

      const leaveDays =
        calculateLeaveDays(
          startDate,
          endDate
        );

      if (leaveDays <= 0) {
        return res.status(400).json({
          message:
            'Invalid leave duration.'
        });
      }

      // -------------------------------------------------
      // CURRENT POLICY
      // -------------------------------------------------

      const policy =
        await getCurrentLeavePolicy();

      const allowed =
        Number(
          policy[leaveType] ??
            0
        );

      // -------------------------------------------------
      // CURRENT BALANCE
      // -------------------------------------------------

      const balance =
        await getEmployeeLeaveBalance(
          req.user.id,
          policy
        );

      const usedDays =
        balance[leaveType]
          .used;

      const remaining =
        balance[leaveType]
          .remaining;

      // -------------------------------------------------
      // LIMIT CHECK
      // -------------------------------------------------

      if (
        leaveDays >
        remaining
      ) {
        return res.status(400).json({
          message:
            `${leaveType} balance insufficient. Allowed: ${allowed}, Used: ${usedDays}, Remaining: ${remaining}, Requested: ${leaveDays}.`,

          leaveType,

          allowed,

          used:
            usedDays,

          remaining,

          requested:
            leaveDays
        });
      }

      // -------------------------------------------------
      // CREATE LEAVE
      // -------------------------------------------------

      const newLeave =
        new Leave({
          user:
            req.user.id,

          leaveType,

          startDate:
            start,

          endDate:
            end,

          reason:
            reason.trim(),

          status:
            'Pending'
        });

      await newLeave.save();

      return res.status(201).json(
        newLeave
      );
    } catch (err) {
      console.error(
        'Apply Leave Error:',
        err
      );

      return res.status(500).json({
        message:
          'Failed to apply leave'
      });
    }
  }
);

// =====================================================
// EMPLOYEE - MY LEAVES
// =====================================================

app.get(
  '/api/leaves/my',
  auth,
  async (req, res) => {
    try {
      if (
        req.user.role ===
        'admin'
      ) {
        return res.status(403).json({
          message:
            'Admin does not have employee leave records.'
        });
      }

      const leaves =
        await Leave.find({
          user:
            req.user.id
        }).sort({
          createdAt:
            -1
        });

      return res.json(
        leaves
      );
    } catch (err) {
      console.error(
        'My Leaves Error:',
        err
      );

      return res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);

// =====================================================
// EMPLOYEE - LEAVE BALANCE
// =====================================================

app.get(
  '/api/leaves/balance',
  auth,
  async (req, res) => {
    try {
      if (
        req.user.role ===
        'admin'
      ) {
        return res.status(403).json({
          message:
            'Admin does not have employee leave balance.'
        });
      }

      const policy =
        await getCurrentLeavePolicy();

      const balance =
        await getEmployeeLeaveBalance(
          req.user.id,
          policy
        );

      return res.json({
        year:
          policy.year,

        limits: {
          CL:
            policy.CL,

          SL:
            policy.SL,

          EL:
            policy.EL,

          LWP:
            policy.LWP,

          CO:
            policy.CO
        },

        balance
      });
    } catch (err) {
      console.error(
        'Leave Balance Error:',
        err
      );

      return res.status(500).json({
        message:
          'Failed to fetch leave balance'
      });
    }
  }
);

// =====================================================
// ADMIN - ALL LEAVES
// =====================================================

app.get(
  '/api/leaves/all',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const leaves =
        await Leave.find()
          .populate(
            'user',
            'name email empCode department designation'
          )
          .sort({
            createdAt:
              -1
          });

      return res.json(
        leaves
      );
    } catch (err) {
      console.error(
        'Fetch All Leaves Error:',
        err
      );

      return res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);

// =====================================================
// ADMIN - APPROVE / REJECT LEAVE
// =====================================================

app.put(
  '/api/leaves/status/:id',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const {
        status
      } = req.body;

      if (
        ![
          'Pending',
          'Approved',
          'Rejected'
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            'Invalid leave status.'
        });
      }

      const leave =
        await Leave.findById(
          req.params.id
        );

      if (!leave) {
        return res.status(404).json({
          message:
            'Leave request not found.'
        });
      }

      // -------------------------------------------------
      // APPROVAL LIMIT CHECK
      // -------------------------------------------------

      if (
        status === 'Approved' &&
        leave.status !==
          'Approved'
      ) {
        const policy =
          await getCurrentLeavePolicy();

        const balance =
          await getEmployeeLeaveBalance(
            leave.user,
            policy
          );

        const requestedDays =
          calculateLeaveDays(
            leave.startDate,
            leave.endDate
          );

        const remaining =
          balance[
            leave.leaveType
          ]?.remaining || 0;

        if (
          requestedDays >
          remaining
        ) {
          return res.status(400).json({
            message:
              `Cannot approve. ${leave.leaveType} balance insufficient. Remaining: ${remaining}, Requested: ${requestedDays}.`
          });
        }
      }

      leave.status =
        status;

      await leave.save();

      const updated =
        await Leave.findById(
          leave._id
        ).populate(
          'user',
          'name email empCode department designation'
        );

      return res.json(
        updated
      );
    } catch (err) {
      console.error(
        'Update Leave Status Error:',
        err
      );

      return res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);

// =====================================================
// ADMIN - GET LEAVE LIMITS
// =====================================================

app.get(
  '/api/admin/leave-limits',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const policy =
        await getCurrentLeavePolicy();

      return res.json({
        year:
          policy.year,

        limits: {
          CL:
            policy.CL,

          SL:
            policy.SL,

          EL:
            policy.EL,

          LWP:
            policy.LWP,

          CO:
            policy.CO
        }
      });
    } catch (err) {
      console.error(
        'Get Leave Limits Error:',
        err
      );

      return res.status(500).json({
        message:
          'Failed to fetch leave limits'
      });
    }
  }
);

// =====================================================
// ADMIN - UPDATE LEAVE LIMITS
// =====================================================

app.put(
  '/api/admin/leave-limits',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const {
        CL,
        SL,
        EL,
        LWP,
        CO
      } = req.body;

      const values = {
        CL,
        SL,
        EL,
        LWP,
        CO
      };

      // Validate values
      for (
        const [
          key,
          value
        ] of Object.entries(
          values
        )
      ) {
        if (
          value !== undefined &&
          (
            value === '' ||
            isNaN(Number(value)) ||
            Number(value) < 0
          )
        ) {
          return res.status(400).json({
            message:
              `${key} limit must be a valid number greater than or equal to 0.`
          });
        }
      }

      const year =
        new Date().getFullYear();

      let policy =
        await LeavePolicy.findOne({
          year
        });

      if (!policy) {
        policy =
          new LeavePolicy({
            year,
            ...DEFAULT_LEAVE_LIMITS
          });
      }

      if (
        CL !== undefined
      ) {
        policy.CL =
          Number(CL);
      }

      if (
        SL !== undefined
      ) {
        policy.SL =
          Number(SL);
      }

      if (
        EL !== undefined
      ) {
        policy.EL =
          Number(EL);
      }

      if (
        LWP !== undefined
      ) {
        policy.LWP =
          Number(LWP);
      }

      if (
        CO !== undefined
      ) {
        policy.CO =
          Number(CO);
      }

      await policy.save();

      return res.json({
        message:
          'Leave limits updated successfully',

        year:
          policy.year,

        limits: {
          CL:
            policy.CL,

          SL:
            policy.SL,

          EL:
            policy.EL,

          LWP:
            policy.LWP,

          CO:
            policy.CO
        }
      });
    } catch (err) {
      console.error(
        'Update Leave Limits Error:',
        err
      );

      return res.status(500).json({
        message:
          'Failed to update leave limits'
      });
    }
  }
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/',
  (req, res) => {
    res.json({
      message:
        'HRMS Leave Management API is running',

      status:
        'OK'
    });
  }
);

// =====================================================
// DATABASE CONNECTION
// =====================================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      'MongoDB Connected Successfully'
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running on port ${PORT}`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      'MongoDB Connection Error:',
      err
    );
  });