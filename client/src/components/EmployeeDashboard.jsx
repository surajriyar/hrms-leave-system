import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('user') || '{}')
  );
  const token = localStorage.getItem('token');

  const [leaves, setLeaves] = useState([]);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    empCode: '',
    gender: '',
    department: '',
    designation: '',
    costCenter: '',
    dob: '',
    doj: '',
    password: ''
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Sync state whenever currentUser changes
  useEffect(() => {
    setProfileData({
      name: currentUser.name || '',
      empCode: currentUser.empCode || '',
      gender: currentUser.gender || '',
      department: currentUser.department || '',
      designation: currentUser.designation || '',
      costCenter: currentUser.costCenter || '',
      dob: currentUser.dob || '',
      doj: currentUser.doj || '',
      password: ''
    });
  }, [currentUser]);

  const fetchMyLeaves = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/leaves/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leaves');
      const data = await res.json();
      setLeaves(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchMyLeaves();
  }, [token]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/leaves/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason, days: Number(days) })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error applying leave');

      setSuccess('Leave request submitted successfully!');
      setReason('');
      setDays('');
      fetchMyLeaves();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setUpdatingProfile(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });

      setTimeout(() => {
        setIsProfileOpen(false);
        setProfileMsg({ type: '', text: '' });
      }, 1000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '700'
            }}
          >
            L
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>LeaveTrack</h1>
            <p style={{ fontSize: '12px', color: '#64748b' }}>HRMS Employee Portal</p>
          </div>
        </div>

        {/* Profile Pill & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Clickable Profile Badge */}
          <div
            onClick={() => setIsProfileOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: '#f1f5f9',
              borderRadius: '24px',
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              transition: 'background 0.2s'
            }}
            title="Click to view & edit your profile"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#4f46e5',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px'
              }}
            >
              {(currentUser.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                {currentUser.name || 'Employee'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {currentUser.empCode ? `ID: ${currentUser.empCode}` : 'View Profile'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>
        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Applied</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>
              {leaves.length}
            </div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Pending Approval</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b', marginTop: '6px' }}>
              {pendingCount}
            </div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Approved Requests</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981', marginTop: '6px' }}>
              {approvedCount}
            </div>
          </div>
        </div>

        {/* Dashboard Layout: Left Form, Right Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
          {/* Apply Leave Card */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
              Request New Leave
            </h2>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
                {success}
              </div>
            )}

            <form onSubmit={handleApplyLeave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="e.g. 2"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Reason
                </label>
                <textarea
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State your reason..."
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Leave History Card */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>My Applications</h2>
            </div>

            {leaves.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                No leave applications submitted yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '12px 20px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px' }}>Days</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px' }}>Reason</th>
                    <th style={{ textAlign: 'right', padding: '12px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {new Date(l.appliedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                        {l.days} {l.days === 1 ? 'day' : 'days'}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#334155' }}>{l.reason}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor:
                              l.status === 'Approved' ? '#ecfdf5' : l.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                            color:
                              l.status === 'Approved' ? '#047857' : l.status === 'Rejected' ? '#b91c1c' : '#b45309'
                          }}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* HRMS PROFILE & EDIT MODAL (Opens only on avatar/profile click) */}
      {isProfileOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Employee HRMS Profile
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Manage and update your official employment records
                </p>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {profileMsg.text && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  background: profileMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: profileMsg.type === 'success' ? '#059669' : '#dc2626'
                }}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Emp Code
                  </label>
                  <input
                    type="text"
                    name="empCode"
                    value={profileData.empCode}
                    onChange={handleProfileChange}
                    placeholder="e.g. 3132"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Emp Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    placeholder="Mr RAJ SANDEEP SINGH"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Email (Read Only)
                  </label>
                  <input
                    type="email"
                    value={currentUser.email || ''}
                    disabled
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', fontSize: '13px', cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={profileData.gender}
                    onChange={handleProfileChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    placeholder="e.g. IT"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={profileData.designation}
                    onChange={handleProfileChange}
                    placeholder="e.g. A.G.M"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Cost Center
                  </label>
                  <input
                    type="text"
                    name="costCenter"
                    value={profileData.costCenter}
                    onChange={handleProfileChange}
                    placeholder="e.g. IT"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={profileData.dob}
                    onChange={handleProfileChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    name="doj"
                    value={profileData.doj}
                    onChange={handleProfileChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={profileData.password}
                    onChange={handleProfileChange}
                    placeholder="Leave empty to keep current"
                    minLength="6"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    padding: '9px 16px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  style={{
                    padding: '9px 16px',
                    background: '#4f46e5',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    opacity: updatingProfile ? 0.7 : 1
                  }}
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}