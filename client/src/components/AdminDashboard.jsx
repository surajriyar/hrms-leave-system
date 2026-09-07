import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  });

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState('ALL');

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  const [activeTab, setActiveTab] = useState('PROFILE');
  const [currentView, setCurrentView] = useState('profile');

  // Add Employee
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('IT');
  const [newEmpDesig, setNewEmpDesig] = useState('Software Engineer');
  const [newEmpGender, setNewEmpGender] = useState('Male');
  const [addEmpMsg, setAddEmpMsg] = useState({ type: '', text: '' });

  // Leave
  const [leaveType, setLeaveType] = useState('CL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  // Profile
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [department, setDepartment] = useState(user?.department || 'Management');
  const [designation, setDesignation] = useState(user?.designation || 'System Admin');
  const [phone, setPhone] = useState(user?.phone || '');
  const [picture, setPicture] = useState(user?.picture || '');

  const token = localStorage.getItem('token');

  // =========================
  // FETCH LEAVES
  // =========================
  const fetchAllLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaves/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setLeaves(data);
      } else {
        setLeaves([]);
      }
    } catch (err) {
      console.error(err);
      setLeaves([]);
    }
  };

  // =========================
  // FETCH EMPLOYEES
  // =========================
  const fetchAllEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/employees`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setEmployees(data);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/');
    } else {
      fetchAllLeaves();
      fetchAllEmployees();
    }
  }, [token]);

  // =========================
  // NAVIGATION
  // =========================
  const changeTab = (tab, view = null) => {
    setActiveTab(tab);

    if (view) {
      setCurrentView(view);
    }

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // =========================
  // ADD EMPLOYEE
  // =========================
  const handleAddEmployee = async (e) => {
    e.preventDefault();

    setAddEmpMsg({
      type: '',
      text: ''
    });

    try {
      const res = await fetch(`${API_URL}/api/admin/add-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          empCode: newEmpCode,
          name: newEmpName,
          email: newEmpEmail,
          department: newEmpDept,
          designation: newEmpDesig,
          gender: newEmpGender
        })
      });

      const data = await res.json();

      if (res.ok) {
        setAddEmpMsg({
          type: 'success',
          text: `Employee ${newEmpName} (${newEmpCode}) successfully add ho gaya! Default password: ${newEmpCode}`
        });

        setNewEmpCode('');
        setNewEmpName('');
        setNewEmpEmail('');

        fetchAllEmployees();
      } else {
        setAddEmpMsg({
          type: 'error',
          text: data?.message || 'Employee add karne mein dikkat aayi'
        });
      }
    } catch (err) {
      setAddEmpMsg({
        type: 'error',
        text: 'Backend connection error!'
      });
    }
  };

  // =========================
  // IMAGE
  // =========================
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPicture(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  // =========================
  // APPLY LEAVE
  // =========================
  const handleApplyLeave = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/leaves/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Leave requisition submitted!');

        setStartDate('');
        setEndDate('');
        setReason('');
        setLeaveType('CL');

        fetchAllLeaves();
      } else {
        alert(data?.message || 'Error submitting requisition');
      }
    } catch (err) {
      console.error(err);
      alert('Backend connection error');
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/leaves/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status
        })
      });

      if (res.ok) {
        fetchAllLeaves();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // CHANGE PASSWORD
  // =========================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPwdMsg({
      type: '',
      text: ''
    });

    if (newPassword !== confirmPassword) {
      setPwdMsg({
        type: 'error',
        text: 'New password aur Confirm password match nahi ho rahe!'
      });

      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPwdMsg({
          type: 'success',
          text: data?.message || 'Password successfully updated!'
        });

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({
          type: 'error',
          text: data?.message || 'Password update failed!'
        });
      }
    } catch (err) {
      setPwdMsg({
        type: 'error',
        text: 'Backend connection error!'
      });
    }
  };

  // =========================
  // UPDATE PROFILE
  // =========================
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          department,
          phone,
          designation,
          picture
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Profile updated successfully!');

        setUser(data.user);

        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        );

        setIsEditModalOpen(false);
      } else {
        alert(data?.message || 'Profile update failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const safeLeaves = Array.isArray(leaves) ? leaves : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const filteredLeaves = safeLeaves.filter((l) => {
    if (filter === 'ALL') return true;

    return l?.status === filter;
  });

  const pendingCount = safeLeaves.filter(
    (l) => l?.status === 'Pending'
  ).length;

  const approvedCount = safeLeaves.filter(
    (l) => l?.status === 'Approved'
  ).length;

  const rejectedCount = safeLeaves.filter(
    (l) => l?.status === 'Rejected'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* ================================
          TOP NAVBAR
      ================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="flex min-h-[70px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* Mobile Menu */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-xl shadow-lg shadow-orange-200">
                🛡️
              </div>

              <div className="hidden sm:block">
                <h1 className="text-base font-extrabold text-slate-900">
                  Leave Management
                </h1>

                <p className="text-xs text-slate-500">
                  Admin Portal
                </p>
              </div>

            </div>
          </div>

          {/* DESKTOP TABS */}
          <nav className="hidden items-center gap-1 lg:flex">

            {[
              'PROFILE',
              'ADD EMPLOYEE',
              'REQUISITIONS',
              'APPROVE REQUISITIONS',
              'REPORTS'
            ].map((tab) => (

              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);

                  if (tab === 'PROFILE') {
                    setCurrentView('profile');
                  }
                }}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition xl:px-4 ${
                  activeTab === tab
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>

            ))}

          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            <div className="hidden text-right md:block">
              <p className="text-xs text-slate-500">
                Welcome back
              </p>

              <p className="text-sm font-bold text-slate-800">
                {user?.name || 'System Admin'}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-500 to-amber-400 font-bold text-white shadow-md">

              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Admin"
                  className="h-full w-full object-cover"
                />
              ) : (
                (user?.name || 'A')
                  .charAt(0)
                  .toUpperCase()
              )}

            </div>

            <button
              onClick={handleLogout}
              className="hidden rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 sm:block"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* ================================
          MOBILE OVERLAY
      ================================= */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* ================================
          SIDEBAR
      ================================= */}
      <aside
        className={`fixed left-0 top-[70px] z-50 h-[calc(100vh-70px)] w-[280px] transform border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-[70px] lg:z-30 lg:float-left lg:h-[calc(100vh-70px)] lg:shadow-none ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:-translate-x-full'
        }`}
      >

        <div className="flex h-full flex-col">

          {/* Sidebar Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-orange-500 to-amber-400 p-5 text-white">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-medium text-orange-100">
                  ADMIN
                </p>

                <h2 className="mt-1 text-lg font-extrabold">
                  Navigation
                </h2>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg bg-white/20 px-2 py-1 text-lg lg:hidden"
              >
                ×
              </button>

            </div>

          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-3">

            <div className="space-y-1">

              <button
                onClick={() =>
                  changeTab('PROFILE', 'profile')
                }
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === 'PROFILE' &&
                  currentView === 'profile'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                👤
                <span>My Profile</span>
              </button>

              <button
                onClick={() => changeTab('ADD EMPLOYEE')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === 'ADD EMPLOYEE'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                ➕
                <span>Add New Employee</span>
              </button>

              <button
                onClick={() => changeTab('REQUISITIONS')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === 'REQUISITIONS'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📝
                <span>Apply Requisition</span>
              </button>

              <button
                onClick={() => {
                  setFilter('ALL');
                  changeTab('APPROVE REQUISITIONS');
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === 'APPROVE REQUISITIONS'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  ✅
                  Approve Requisitions
                </span>

                {pendingCount > 0 && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    {pendingCount}
                  </span>
                )}

              </button>

              <button
                onClick={() =>
                  changeTab('PROFILE', 'change-password')
                }
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === 'PROFILE' &&
                  currentView === 'change-password'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔐
                <span>Change Password</span>
              </button>

              <button
                onClick={() => changeTab('REPORTS')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === 'REPORTS'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📊
                <span>Reports & Summary</span>
              </button>

            </div>

          </div>

          {/* Sidebar Bottom */}
          <div className="border-t border-slate-200 p-4">

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 sm:hidden"
            >
              🚪 Logout
            </button>

          </div>

        </div>

      </aside>

      {/* ================================
          MAIN CONTENT
      ================================= */}
      <main className="min-h-[calc(100vh-70px)] lg:ml-[280px]">

        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">

          {/* Mobile Page Navigation */}
          <div className="mb-5 flex items-center justify-between lg:hidden">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                Admin Dashboard
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                {activeTab === 'PROFILE'
                  ? currentView === 'change-password'
                    ? 'Change Password'
                    : 'My Profile'
                  : activeTab}
              </h2>
            </div>

            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200"
            >
              Menu
            </button>

          </div>

          {/* MAIN CARD */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="p-4 sm:p-6 lg:p-8">

              {/* ============================
                  ADD EMPLOYEE
              ============================= */}
              {activeTab === 'ADD EMPLOYEE' && (

                <div>

                  <div className="mb-6">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                          Employee Management
                        </p>

                        <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                          Add New Employee
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Employee create hote hi default password Emp Code hoga.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
                        👥 {safeEmployees.length} Employees
                      </div>

                    </div>

                  </div>

                  {addEmpMsg.text && (
                    <div
                      className={`mb-6 rounded-2xl border px-4 py-4 text-sm font-medium ${
                        addEmpMsg.type === 'error'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {addEmpMsg.text}
                    </div>
                  )}

                  <form
                    onSubmit={handleAddEmployee}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2"
                  >

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Emp Code
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. 3133"
                        value={newEmpCode}
                        onChange={(e) =>
                          setNewEmpCode(e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Full Name
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. Amit Sharma"
                        value={newEmpName}
                        onChange={(e) =>
                          setNewEmpName(e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Official Email
                      </label>

                      <input
                        type="email"
                        placeholder="amit@company.com"
                        value={newEmpEmail}
                        onChange={(e) =>
                          setNewEmpEmail(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Department
                      </label>

                      <select
                        value={newEmpDept}
                        onChange={(e) =>
                          setNewEmpDept(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      >
                        <option value="IT">IT</option>
                        <option value="HR">HR</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Designation
                      </label>

                      <input
                        type="text"
                        placeholder="Software Engineer"
                        value={newEmpDesig}
                        onChange={(e) =>
                          setNewEmpDesig(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Gender
                      </label>

                      <select
                        value={newEmpGender}
                        onChange={(e) =>
                          setNewEmpGender(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                      >
                        REGISTER EMPLOYEE
                      </button>

                    </div>

                  </form>

                  {/* DIRECTORY */}
                  <div className="mt-10">

                    <div className="mb-4">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        Employee Directory
                      </h3>

                      <p className="text-sm text-slate-500">
                        All registered employees
                      </p>
                    </div>

                    {safeEmployees.length === 0 ? (

                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <div className="text-3xl">👥</div>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          No employees added yet.
                        </p>
                      </div>

                    ) : (

                      <div className="overflow-x-auto rounded-2xl border border-slate-200">

                        <table className="min-w-[800px] w-full text-left text-sm">

                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-4 font-bold text-slate-600">
                                Emp Code
                              </th>

                              <th className="px-4 py-4 font-bold text-slate-600">
                                Name
                              </th>

                              <th className="px-4 py-4 font-bold text-slate-600">
                                Department
                              </th>

                              <th className="px-4 py-4 font-bold text-slate-600">
                                Designation
                              </th>

                              <th className="px-4 py-4 font-bold text-slate-600">
                                Email
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">

                            {safeEmployees.map((emp) => (

                              <tr
                                key={emp._id}
                                className="transition hover:bg-orange-50/50"
                              >

                                <td className="px-4 py-4 font-bold text-orange-600">
                                  {emp.empCode}
                                </td>

                                <td className="px-4 py-4 font-semibold text-slate-800">
                                  {emp.name}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {emp.department}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {emp.designation}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {emp.email}
                                </td>

                              </tr>

                            ))}

                          </tbody>

                        </table>

                      </div>

                    )}

                  </div>

                </div>

              )}

              {/* ============================
                  PROFILE
              ============================= */}
              {activeTab === 'PROFILE' &&
                currentView === 'profile' && (

                <div>

                  <div className="mb-7 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                        Account
                      </p>

                      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                        My Profile
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        setCurrentView('change-password')
                      }
                      className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
                    >
                      🔐 Change Password
                    </button>

                  </div>

                  <div className="grid gap-8 lg:grid-cols-[240px_1fr]">

                    {/* PROFILE IMAGE */}
                    <div className="flex flex-col items-center">

                      <div className="h-48 w-40 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl ring-1 ring-slate-200">

                        {user?.picture ? (

                          <img
                            src={user.picture}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />

                        ) : (

                          <div className="flex h-full flex-col items-center justify-center text-slate-400">

                            <div className="text-6xl">
                              👤
                            </div>

                            <span className="mt-2 text-xs font-semibold">
                              No Image
                            </span>

                          </div>

                        )}

                      </div>

                      <div className="mt-4 rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600">
                        🛡️ Administrator
                      </div>

                    </div>

                    {/* DETAILS */}
                    <div>

                      <div className="mb-6">
                        <h3 className="text-xl font-extrabold text-slate-900">
                          {user?.name || 'System Administrator'}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {user?.designation || 'System Admin'}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">

                        {[
                          ['Emp Code', user?.empCode || 'ADMIN'],
                          ['Employee Name', user?.name || 'System Administrator'],
                          ['Role', 'Admin'],
                          ['Department', user?.department || 'Management'],
                          ['Designation', user?.designation || 'System Admin'],
                          ['Cost Center', 'HQ'],
                          ['Date of Joining', '01 Jan 2024'],
                          ['Phone', user?.phone || 'Not Available']
                        ].map(([label, value]) => (

                          <div
                            key={label}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                          >

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {label}
                            </p>

                            <p
                              className={`mt-1 text-sm font-bold ${
                                label === 'Role'
                                  ? 'text-orange-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {value}
                            </p>

                          </div>

                        ))}

                      </div>

                      <div className="mt-6">

                        <button
                          onClick={() =>
                            setIsEditModalOpen(true)
                          }
                          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                          ✏️ Edit Profile
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* ============================
                  CHANGE PASSWORD
              ============================= */}
              {activeTab === 'PROFILE' &&
                currentView === 'change-password' && (

                <div className="max-w-xl">

                  <div className="mb-7 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                        Security
                      </p>

                      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                        Change Password
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        setCurrentView('profile')
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                    >
                      ← Profile
                    </button>

                  </div>

                  {pwdMsg.text && (
                    <div
                      className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${
                        pwdMsg.type === 'error'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {pwdMsg.text}
                    </div>
                  )}

                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-5"
                  >

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Old Password
                      </label>

                      <input
                        type="password"
                        placeholder="Enter old password"
                        value={oldPassword}
                        onChange={(e) =>
                          setOldPassword(e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        New Password
                      </label>

                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Confirm Password
                      </label>

                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 font-extrabold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      UPDATE PASSWORD
                    </button>

                  </form>

                </div>

              )}

              {/* ============================
                  REQUISITIONS
              ============================= */}
              {activeTab === 'REQUISITIONS' && (

                <div className="max-w-2xl">

                  <div className="mb-7">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                      Leave Management
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                      Apply Leave Requisition
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Submit a new leave request.
                    </p>
                  </div>

                  <form
                    onSubmit={handleApplyLeave}
                    className="space-y-5"
                  >

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Leave Type
                      </label>

                      <select
                        value={leaveType}
                        onChange={(e) =>
                          setLeaveType(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      >
                        <option value="CL">
                          CL - Casual Leave
                        </option>

                        <option value="EL">
                          EL - Earned Leave
                        </option>

                        <option value="CO">
                          CO - Compensatory Off
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          Start Date
                        </label>

                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) =>
                            setStartDate(e.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          End Date
                        </label>

                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) =>
                            setEndDate(e.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Reason
                      </label>

                      <textarea
                        placeholder="Reason for leave..."
                        value={reason}
                        onChange={(e) =>
                          setReason(e.target.value)
                        }
                        required
                        rows="5"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 font-extrabold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                    >
                      SUBMIT REQUISITION
                    </button>

                  </form>

                </div>

              )}

              {/* ============================
                  APPROVE REQUISITIONS
              ============================= */}
              {activeTab === 'APPROVE REQUISITIONS' && (

                <div>

                  <div className="mb-6 flex flex-col gap-5 border-b border-slate-100 pb-6 xl:flex-row xl:items-center xl:justify-between">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                        Leave Requests
                      </p>

                      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                        Approve / Reject Requisitions
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">

                      {[
                        'ALL',
                        'Pending',
                        'Approved',
                        'Rejected'
                      ].map((status) => (

                        <button
                          key={status}
                          onClick={() =>
                            setFilter(status)
                          }
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                            filter === status
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {status}
                        </button>

                      ))}

                    </div>

                  </div>

                  {filteredLeaves.length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

                      <div className="text-4xl">
                        📭
                      </div>

                      <p className="mt-3 font-semibold text-slate-500">
                        No requisitions matching this filter.
                      </p>

                    </div>

                  ) : (

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">

                      <table className="min-w-[1000px] w-full text-left text-sm">

                        <thead className="bg-slate-50">

                          <tr>

                            <th className="px-4 py-4 font-bold text-slate-600">
                              Employee
                            </th>

                            <th className="px-4 py-4 font-bold text-slate-600">
                              Type
                            </th>

                            <th className="px-4 py-4 font-bold text-slate-600">
                              Dates
                            </th>

                            <th className="px-4 py-4 font-bold text-slate-600">
                              Reason
                            </th>

                            <th className="px-4 py-4 font-bold text-slate-600">
                              Status
                            </th>

                            <th className="px-4 py-4 text-center font-bold text-slate-600">
                              Actions
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                          {filteredLeaves.map((l) => (

                            <tr
                              key={l?._id}
                              className="transition hover:bg-orange-50/40"
                            >

                              <td className="px-4 py-4">

                                <p className="font-bold text-slate-800">
                                  {l?.user?.name || 'Employee'}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Code: {l?.user?.empCode || 'N/A'}
                                </p>

                              </td>

                              <td className="px-4 py-4">
                                <span className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                                  {l?.leaveType || 'CL'}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-4 py-4 text-slate-600">

                                {l?.startDate
                                  ? new Date(
                                      l.startDate
                                    ).toLocaleDateString()
                                  : ''}

                                {' → '}

                                {l?.endDate
                                  ? new Date(
                                      l.endDate
                                    ).toLocaleDateString()
                                  : ''}

                              </td>

                              <td className="max-w-[250px] px-4 py-4 text-slate-600">
                                {l?.reason || '—'}
                              </td>

                              <td className="px-4 py-4">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    l?.status === 'Approved'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : l?.status === 'Rejected'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-amber-50 text-amber-600'
                                  }`}
                                >
                                  {l?.status || 'Pending'}
                                </span>

                              </td>

                              <td className="px-4 py-4 text-center">

                                {l?.status === 'Pending' ? (

                                  <div className="flex justify-center gap-2">

                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(
                                          l._id,
                                          'Approved'
                                        )
                                      }
                                      className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
                                    >
                                      Approve
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(
                                          l._id,
                                          'Rejected'
                                        )
                                      }
                                      className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                                    >
                                      Reject
                                    </button>

                                  </div>

                                ) : (

                                  <span className="text-xs font-medium italic text-slate-400">
                                    Done
                                  </span>

                                )}

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              )}

              {/* ============================
                  REPORTS
              ============================= */}
              {activeTab === 'REPORTS' && (

                <div>

                  <div className="mb-7">

                    <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                      Analytics
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                      Leave Reports
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Overview of all leave requisitions.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                    {/* TOTAL */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total
                          </p>

                          <p className="mt-2 text-4xl font-black text-slate-900">
                            {safeLeaves.length}
                          </p>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                          📋
                        </div>

                      </div>

                    </div>

                    {/* PENDING */}
                    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                            Pending
                          </p>

                          <p className="mt-2 text-4xl font-black text-amber-700">
                            {pendingCount}
                          </p>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                          ⏳
                        </div>

                      </div>

                    </div>

                    {/* APPROVED */}
                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                            Approved
                          </p>

                          <p className="mt-2 text-4xl font-black text-emerald-700">
                            {approvedCount}
                          </p>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                          ✅
                        </div>

                      </div>

                    </div>

                    {/* REJECTED */}
                    <div className="rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                            Rejected
                          </p>

                          <p className="mt-2 text-4xl font-black text-red-700">
                            {rejectedCount}
                          </p>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                          ❌
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </section>

        </div>

      </main>

      {/* ================================
          EDIT PROFILE MODAL
      ================================= */}
      {isEditModalOpen && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-7">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  Account
                </p>

                <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                  Update Profile
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsEditModalOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleUpdateProfile}
              className="space-y-5 p-5 sm:p-7"
            >

              {/* Picture */}
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">

                    {picture ? (

                      <img
                        src={picture}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center text-3xl">
                        👤
                      </div>

                    )}

                  </div>

                  <div className="min-w-0">

                    <label className="mb-1 block text-sm font-bold text-slate-800">
                      Profile Picture
                    </label>

                    <p className="mb-3 text-xs text-slate-500">
                      Upload JPG, PNG or other image.
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-orange-600"
                    />

                  </div>

                </div>

              </div>

              {/* Department */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Department
                </label>

                <input
                  type="text"
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Designation
                </label>

                <input
                  type="text"
                  value={designation}
                  onChange={(e) =>
                    setDesignation(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Phone
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setIsEditModalOpen(false)
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:shadow-xl"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default AdminDashboard;