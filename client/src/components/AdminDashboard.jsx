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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Tabs: PROFILE -> ADD EMPLOYEE -> REQUISITIONS -> APPROVE REQUISITIONS -> REPORTS
  const [activeTab, setActiveTab] = useState('PROFILE');
  const [currentView, setCurrentView] = useState('profile');

  // Add Employee Form States
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('IT');
  const [newEmpDesig, setNewEmpDesig] = useState('Software Engineer');
  const [newEmpGender, setNewEmpGender] = useState('Male');
  const [addEmpMsg, setAddEmpMsg] = useState({ type: '', text: '' });

  // Leave Form States (Requisition tab)
  const [leaveType, setLeaveType] = useState('CL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  // Profile Edit States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [department, setDepartment] = useState(user?.department || 'Management');
  const [designation, setDesignation] = useState(user?.designation || 'System Admin');
  const [phone, setPhone] = useState(user?.phone || '');
  const [picture, setPicture] = useState(user?.picture || '');

  const token = localStorage.getItem('token');

  // Fetch Leaves
  const fetchAllLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaves/all`, {
        headers: { Authorization: `Bearer ${token}` }
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

  // Fetch Employees
  const fetchAllEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
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

  // Handle Add Employee Submit
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddEmpMsg({ type: '', text: '' });

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
        setAddEmpMsg({ type: 'success', text: `Employee ${newEmpName} (${newEmpCode}) successfully add ho gaya! Default password: ${newEmpCode}` });
        setNewEmpCode('');
        setNewEmpName('');
        setNewEmpEmail('');
        fetchAllEmployees();
      } else {
        setAddEmpMsg({ type: 'error', text: data?.message || 'Employee add karne mein dikkat aayi' });
      }
    } catch (err) {
      setAddEmpMsg({ type: 'error', text: 'Backend connection error!' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPicture(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/leaves/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ leaveType, startDate, endDate, reason })
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

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/leaves/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New password aur Confirm password match nahi ho rahe!' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setPwdMsg({ type: 'success', text: data?.message || 'Password successfully updated!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ type: 'error', text: data?.message || 'Password update failed!' });
      }
    } catch (err) {
      setPwdMsg({ type: 'error', text: 'Backend connection error!' });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ department, phone, designation, picture })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Profile updated successfully!');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsEditModalOpen(false);
      } else {
        alert(data?.message || 'Profile update failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Top Navbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 25px',
        borderBottom: '1px solid #e5dccb',
        background: '#fff8ee'
      }}>
        <div style={{ display: 'flex', gap: '22px', fontWeight: 'bold', fontSize: '13px', color: '#1a365d' }}>
          {['PROFILE', 'ADD EMPLOYEE', 'REQUISITIONS', 'APPROVE REQUISITIONS', 'REPORTS'].map((tab) => (
            <span
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'PROFILE') setCurrentView('profile');
              }}
              style={{
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #e67e22' : 'none',
                paddingBottom: '4px',
                color: activeTab === tab ? '#d35400' : '#1a365d'
              }}
            >
              {tab}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '12px', color: '#555' }}>
            Admin: <strong>{user?.name || 'System Admin'}</strong> ({user?.empCode || 'ADMIN'})
          </span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d35400', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            🚪 Logout
          </button>
          <div style={{
            background: 'linear-gradient(180deg, #f39c12, #d35400)',
            color: '#fff',
            padding: '6px 18px',
            borderRadius: '15px 0 0 15px',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            Saturday 05 Sep 2026
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'linear-gradient(180deg, #ffc97a, #f39c12)',
            border: '1px solid #c97d10',
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          {sidebarOpen ? 'HIDE NAVIGATION' : 'SHOW NAVIGATION'}
        </button>

        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
          {/* Sidebar */}
          {sidebarOpen && (
            <div style={{ width: '220px', flexShrink: 0 }}>
              <div style={{
                background: 'linear-gradient(180deg, #f39c12, #e67e22)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '6px 6px 0 0',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                🛡️ NAVIGATION
              </div>
              <div style={{ background: '#fff', border: '1px solid #e0d7c7', borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
                <div
                  onClick={() => { setActiveTab('PROFILE'); setCurrentView('profile'); }}
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'PROFILE' && currentView === 'profile' ? 'bold' : 'normal',
                    borderBottom: '1px solid #f2ece1',
                    cursor: 'pointer',
                    background: activeTab === 'PROFILE' && currentView === 'profile' ? '#fff3e0' : 'transparent'
                  }}
                >
                  My Profile
                </div>
                <div
                  onClick={() => setActiveTab('ADD EMPLOYEE')}
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'ADD EMPLOYEE' ? 'bold' : 'normal',
                    borderBottom: '1px solid #f2ece1',
                    cursor: 'pointer',
                    background: activeTab === 'ADD EMPLOYEE' ? '#fff3e0' : 'transparent',
                    color: '#d35400'
                  }}
                >
                  ➕ Add New Employee
                </div>
                <div
                  onClick={() => setActiveTab('REQUISITIONS')}
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'REQUISITIONS' ? 'bold' : 'normal',
                    borderBottom: '1px solid #f2ece1',
                    cursor: 'pointer',
                    background: activeTab === 'REQUISITIONS' ? '#fff3e0' : 'transparent'
                  }}
                >
                  Apply Requisition
                </div>
                <div
                  onClick={() => { setActiveTab('APPROVE REQUISITIONS'); setFilter('ALL'); }}
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'APPROVE REQUISITIONS' ? 'bold' : 'normal',
                    borderBottom: '1px solid #f2ece1',
                    cursor: 'pointer',
                    background: activeTab === 'APPROVE REQUISITIONS' ? '#fff3e0' : 'transparent'
                  }}
                >
                  Approve Requisitions ({safeLeaves.filter(l => l?.status === 'Pending').length})
                </div>
                <div
                  onClick={() => { setActiveTab('PROFILE'); setCurrentView('change-password'); }}
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'PROFILE' && currentView === 'change-password' ? 'bold' : 'normal',
                    borderBottom: '1px solid #f2ece1',
                    cursor: 'pointer',
                    background: activeTab === 'PROFILE' && currentView === 'change-password' ? '#fff3e0' : 'transparent'
                  }}
                >
                  Change Password
                </div>
                <div
                  onClick={() => setActiveTab('REPORTS')}
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'REPORTS' ? 'bold' : 'normal',
                    cursor: 'pointer',
                    background: activeTab === 'REPORTS' ? '#fff3e0' : 'transparent'
                  }}
                >
                  Reports & Summary
                </div>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div style={{
            flex: 1,
            background: '#fff',
            border: '1px solid #e2dcd0',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>

            {/* TAB 1: ADD EMPLOYEE VIEW */}
            {activeTab === 'ADD EMPLOYEE' && (
              <div>
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#c0392b', fontSize: '15px' }}>Add New Employee</h3>
                  <small style={{ color: '#666' }}>Employee create hote hi uska default password uska Emp Code hoga.</small>
                </div>

                {addEmpMsg.text && (
                  <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    background: addEmpMsg.type === 'error' ? '#fde8e8' : '#def7ec',
                    color: addEmpMsg.type === 'error' ? '#c53030' : '#03543f'
                  }}>
                    {addEmpMsg.text}
                  </div>
                )}

                <form onSubmit={handleAddEmployee} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxWidth: '650px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Emp Code (Unique ID):</label>
                    <input
                      type="text"
                      placeholder="e.g. 3133"
                      value={newEmpCode}
                      onChange={(e) => setNewEmpCode(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Full Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Amit Sharma"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Official Email:</label>
                    <input
                      type="email"
                      placeholder="e.g. amit@company.com"
                      value={newEmpEmail}
                      onChange={(e) => setNewEmpEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Department:</label>
                    <select
                      value={newEmpDept}
                      onChange={(e) => setNewEmpDept(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Designation:</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={newEmpDesig}
                      onChange={(e) => setNewEmpDesig(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Gender:</label>
                    <select
                      value={newEmpGender}
                      onChange={(e) => setNewEmpGender(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(180deg, #ffc97a, #f39c12)',
                        border: '1px solid #c97d10',
                        padding: '9px 20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      REGISTER EMPLOYEE
                    </button>
                  </div>
                </form>

                {/* Directory Table */}
                <div style={{ marginTop: '35px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1a365d' }}>
                    Registered Employees Directory ({safeEmployees.length})
                  </h4>
                  {safeEmployees.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#777' }}>No employees added yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#fdf6ee', borderBottom: '2px solid #e0d7c7', textAlign: 'left' }}>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Emp Code</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Name</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Department</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Designation</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeEmployees.map((emp) => (
                          <tr key={emp._id}>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7', fontWeight: 'bold' }}>{emp.empCode}</td>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{emp.name}</td>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{emp.department}</td>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{emp.designation}</td>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{emp.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE VIEW */}
            {activeTab === 'PROFILE' && currentView === 'profile' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#c0392b', fontSize: '15px' }}>My Profile</h3>
                  <button
                    onClick={() => setCurrentView('change-password')}
                    style={{
                      background: 'linear-gradient(180deg, #ffc97a, #f39c12)',
                      border: '1px solid #c97d10',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '3px'
                    }}
                  >
                    CHANGE YOUR PASSWORD
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '130px',
                    height: '150px',
                    border: '1px solid #bbb',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#fafafa',
                    overflow: 'hidden'
                  }}>
                    {user?.picture ? (
                      <img src={user.picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #b33939', position: 'relative', marginBottom: '10px' }}>
                          <div style={{ position: 'absolute', width: '100%', height: '2px', background: '#b33939', top: '50%', transform: 'rotate(-45deg)' }}></div>
                        </div>
                        <span style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>Image Not Available</span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '130px 20px auto', rowGap: '12px', fontSize: '13px', color: '#222' }}>
                    <span>Emp Code</span><span>:</span><strong>{user?.empCode || 'ADMIN'}</strong>
                    <span>Emp Name</span><span>:</span><span>{user?.name || 'System Administrator'}</span>
                    <span>Role</span><span>:</span><strong style={{ color: '#d35400' }}>Admin</strong>
                    <span>Departments</span><span>:</span><span>{user?.department || 'Management'}</span>
                    <span>Designation</span><span>:</span><span>{user?.designation || 'System Admin'}</span>
                    <span>Cost Center</span><span>:</span><span>HQ</span>
                    <span>Date of Joining</span><span>:</span><span>01 Jan 2024</span>
                  </div>
                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    style={{
                      background: 'linear-gradient(180deg, #ffc97a, #f39c12)',
                      border: '1px solid #c97d10',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '3px'
                    }}
                  >
                    EDIT YOUR PROFILE
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CHANGE PASSWORD */}
            {activeTab === 'PROFILE' && currentView === 'change-password' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#c0392b', fontSize: '15px' }}>Change Password</h3>
                  <button
                    onClick={() => setCurrentView('profile')}
                    style={{ background: '#f1f5f9', border: '1px solid #ccc', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '3px' }}
                  >
                    ← Back to Profile
                  </button>
                </div>

                {pwdMsg.text && (
                  <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', fontSize: '13px', background: pwdMsg.type === 'error' ? '#fde8e8' : '#def7ec', color: pwdMsg.type === 'error' ? '#c53030' : '#03543f' }}>
                    {pwdMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ maxWidth: '400px', display: 'grid', gap: '15px' }}>
                  <input type="password" placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <button type="submit" style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '8px 16px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>UPDATE PASSWORD</button>
                </form>
              </div>
            )}

            {/* TAB 3: REQUISITIONS VIEW */}
            {activeTab === 'REQUISITIONS' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#c0392b', fontSize: '15px' }}>Apply Leave Requisition</h3>
                <form onSubmit={handleApplyLeave} style={{ display: 'grid', gap: '15px', maxWidth: '500px' }}>
                  <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="CL">CL - Casual Leave</option>
                    <option value="EL">EL - Earned Leave</option>
                    <option value="CO">CO - Compensatory Off</option>
                  </select>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  </div>
                  <textarea placeholder="Reason for leave..." value={reason} onChange={(e) => setReason(e.target.value)} required rows="3" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <button type="submit" style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '8px 16px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', width: 'fit-content' }}>SUBMIT REQUISITION</button>
                </form>
              </div>
            )}

            {/* TAB 4: APPROVE REQUISITIONS VIEW */}
            {activeTab === 'APPROVE REQUISITIONS' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#c0392b', fontSize: '15px' }}>Approve / Reject Leave Requisitions</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['ALL', 'Pending', 'Approved', 'Rejected'].map(s => (
                      <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? '#d35400' : '#f8f9fa', color: filter === s ? '#fff' : '#333', border: '1px solid #ccc', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '3px' }}>{s}</button>
                    ))}
                  </div>
                </div>

                {filteredLeaves.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#777' }}>No requisitions matching this filter.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#fdf6ee', borderBottom: '2px solid #e0d7c7', textAlign: 'left' }}>
                        <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Employee Details</th>
                        <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Type</th>
                        <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Dates</th>
                        <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Reason</th>
                        <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Status</th>
                        <th style={{ padding: '8px', border: '1px solid #e0d7c7', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaves.map((l) => (
                        <tr key={l?._id || Math.random()}>
                          <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>
                            <strong>{l?.user?.name || 'Mr RAJ SANDEEP SINGH'}</strong><br />
                            <span style={{ color: '#666', fontSize: '11px' }}>Code: {l?.user?.empCode || '3132'}</span>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #e0d7c7', fontWeight: 'bold' }}>{l?.leaveType || 'CL'}</td>
                          <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>
                            {l?.startDate ? new Date(l.startDate).toLocaleDateString() : ''} to {l?.endDate ? new Date(l.endDate).toLocaleDateString() : ''}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{l?.reason || ''}</td>
                          <td style={{ padding: '8px', border: '1px solid #e0d7c7', fontWeight: 'bold', color: l?.status === 'Approved' ? '#27ae60' : l?.status === 'Rejected' ? '#c0392b' : '#d35400' }}>
                            {l?.status || 'Pending'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #e0d7c7', textAlign: 'center' }}>
                            {l?.status === 'Pending' ? (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button onClick={() => handleUpdateStatus(l._id, 'Approved')} style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Approve</button>
                                <button onClick={() => handleUpdateStatus(l._id, 'Rejected')} style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Reject</button>
                              </div>
                            ) : (
                              <span style={{ color: '#888', fontStyle: 'italic', fontSize: '11px' }}>Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 5: REPORTS VIEW */}
            {activeTab === 'REPORTS' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#c0392b', fontSize: '15px' }}>Leave Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TOTAL</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{safeLeaves.length}</div>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '6px', border: '1px solid #fef3c7', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>PENDING</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#b45309', marginTop: '6px' }}>{safeLeaves.filter(l => l?.status === 'Pending').length}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '6px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>APPROVED</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#15803d', marginTop: '6px' }}>{safeLeaves.filter(l => l?.status === 'Approved').length}</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '6px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>REJECTED</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#b91c1c', marginTop: '6px' }}>{safeLeaves.filter(l => l?.status === 'Rejected').length}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '6px', width: '380px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>Update Profile</h4>
            <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: '#fdf6ee', padding: '8px', border: '1px dashed #f39c12', borderRadius: '4px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Upload Profile Picture:</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '11px', width: '100%' }} />
              </div>
              <label>Department:
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%', padding: '6px' }} />
              </label>
              <label>Designation:
                <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} style={{ width: '100%', padding: '6px' }} />
              </label>
              <label>Phone:
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '6px' }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '6px 12px' }}>Cancel</button>
                <button type="submit" style={{ padding: '6px 12px', background: '#f39c12', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;