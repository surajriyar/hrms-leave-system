import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [activeTab, setActiveTab] = useState('PROFILE');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('profile');

  // Leave Form States
  const [leaves, setLeaves] = useState([]);
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
  const [department, setDepartment] = useState(user.department || 'IT');
  const [phone, setPhone] = useState(user.phone || '');
  const [designation, setDesignation] = useState(user.designation || 'A.G.M');
  const [costCenter, setCostCenter] = useState(user.costCenter || 'IT');
  const [dob, setDob] = useState(user.dob || '08 Apr 1976');
  const [picture, setPicture] = useState(user.picture || '');

  const token = localStorage.getItem('token');

  const fetchMyLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaves/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
    } else {
      fetchMyLeaves();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicture(reader.result);
      };
      reader.readAsDataURL(file);
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
        body: JSON.stringify({ department, phone, dob, designation, costCenter, picture })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Profile updated successfully!');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsEditModalOpen(false);
      } else {
        alert(data.message || 'Profile update failed');
      }
    } catch (err) {
      console.error(err);
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
        alert('Leave requisition submitted successfully!');
        setStartDate('');
        setEndDate('');
        setReason('');
        setLeaveType('CL');
        fetchMyLeaves();
      } else {
        alert(data.message || 'Error submitting requisition');
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
        setPwdMsg({ type: 'success', text: data.message || 'Password successfully updated!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ type: 'error', text: data.message || 'Password update failed!' });
      }
    } catch (err) {
      setPwdMsg({ type: 'error', text: 'Backend connection error!' });
    }
  };

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
        <div style={{ display: 'flex', gap: '25px', fontWeight: 'bold', fontSize: '13px', color: '#1a365d' }}>
          {['PROFILE', 'REQUISITIONS', 'REPORTS'].map((tab) => (
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
                📋 NAVIGATION
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
                  Leave Requisition
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
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div style={{
            flex: 1,
            background: '#fff',
            border: '1px solid #e2dcd0',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {/* VIEW 1: PROFILE DETAILS */}
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
                  {/* Photo Frame */}
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
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <>
                        <div style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          border: '2px solid #b33939',
                          position: 'relative',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '2px',
                            background: '#b33939',
                            top: '50%',
                            transform: 'rotate(-45deg)'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>Image Not Available</span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '130px 20px auto', rowGap: '12px', fontSize: '13px', color: '#222' }}>
                    <span>Emp Code</span><span>:</span><strong>{user.empCode || '3132'}</strong>
                    <span>Emp Name</span><span>:</span><span>{user.name || 'Mr RAJ SANDEEP SINGH'}</span>
                    <span>Gender</span><span>:</span><span>{user.gender || 'Male'}</span>
                    <span>Departments</span><span>:</span><span>{user.department || 'IT'}</span>
                    <span>Designation</span><span>:</span><span>{user.designation || 'A.G.M'}</span>
                    <span>Cost Center</span><span>:</span><span>{user.costCenter || 'IT'}</span>
                    <span>Date of Birth</span><span>:</span><span>{user.dob || '08 Apr 1976'}</span>
                    <span>Date of Joining</span><span>:</span><span>{user.doj || '07 Feb 2024'}</span>
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

            {/* VIEW 2: LEAVE REQUISITION */}
            {activeTab === 'REQUISITIONS' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#c0392b', fontSize: '15px' }}>Apply Leave Requisition</h3>
                <form onSubmit={handleApplyLeave} style={{ display: 'grid', gap: '15px', maxWidth: '500px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                      <option value="CL">CL - Casual Leave</option>
                      <option value="EL">EL - Earned Leave</option>
                      <option value="CO">CO - Compensatory Off</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Reason</label>
                    <textarea
                      placeholder="Specify reason..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows="3"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(180deg, #ffc97a, #f39c12)',
                      border: '1px solid #c97d10',
                      padding: '8px 18px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      width: 'fit-content'
                    }}
                  >
                    SUBMIT REQUISITION
                  </button>
                </form>

                {/* History Table */}
                <div style={{ marginTop: '30px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1a365d' }}>My Application History</h4>
                  {leaves.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#777' }}>No leaves applied yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#fdf6ee', borderBottom: '2px solid #e0d7c7', textAlign: 'left' }}>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Type</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>From</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>To</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Reason</th>
                          <th style={{ padding: '8px', border: '1px solid #e0d7c7' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((l) => (
                          <tr key={l._id}>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7', fontWeight: 'bold' }}>{l.leaveType || 'CL'}</td>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{new Date(l.startDate).toLocaleDateString()}</td>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{new Date(l.endDate).toLocaleDateString()}</td>
                            <td style={{ padding: '8px', border: '1px solid #e0d7c7' }}>{l.reason}</td>
                            <td style={{
                              padding: '8px',
                              border: '1px solid #e0d7c7',
                              fontWeight: 'bold',
                              color: l.status === 'Approved' ? '#27ae60' : l.status === 'Rejected' ? '#c0392b' : '#d35400'
                            }}>
                              {l.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 3: CHANGE PASSWORD */}
            {activeTab === 'PROFILE' && currentView === 'change-password' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#c0392b', fontSize: '15px' }}>Change Your Password</h3>
                {pwdMsg.text && (
                  <div style={{ padding: '8px', marginBottom: '10px', fontSize: '12px', background: pwdMsg.type === 'error' ? '#fde8e8' : '#def7ec', color: pwdMsg.type === 'error' ? '#c53030' : '#03543f' }}>
                    {pwdMsg.text}
                  </div>
                )}
                <form onSubmit={handleChangePassword} style={{ maxWidth: '400px', display: 'grid', gap: '12px' }}>
                  <input type="password" placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required style={{ padding: '8px' }} />
                  <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ padding: '8px' }} />
                  <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ padding: '8px' }} />
                  <button type="submit" style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '8px', fontWeight: 'bold', cursor: 'pointer' }}>UPDATE PASSWORD</button>
                </form>
              </div>
            )}

            {/* VIEW 4: REPORTS */}
            {activeTab === 'REPORTS' && (
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#c0392b', fontSize: '15px' }}>Reports</h3>
                <p style={{ fontSize: '13px', color: '#666' }}>Attendance and Leave balance reports will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal with Picture Upload */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
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
              <label>Cost Center:
                <input type="text" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} style={{ width: '100%', padding: '6px' }} />
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

export default EmployeeDashboard;