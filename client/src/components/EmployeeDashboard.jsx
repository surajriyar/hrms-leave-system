import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [leaves, setLeaves] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Profile Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [department, setDepartment] = useState(user.department || '');

  const token = localStorage.getItem('token');

  const fetchMyLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaves/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLeaves(data);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
    } else {
      fetchMyLeaves();
    }
  }, [token]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/leaves/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ startDate, endDate, reason })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Leave application submitted!');
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchMyLeaves();
      } else {
        alert(data.message || 'Error submitting leave');
      }
    } catch (err) {
      console.error('Error submitting leave:', err);
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
        body: JSON.stringify({ phone, department })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Profile updated successfully!');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsModalOpen(false);
      } else {
        alert(data.message || 'Profile update failed');
      }
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
        <div>
          <h2>Welcome, {user.name} 👋</h2>
          <p style={{ margin: 0, color: '#666' }}>Email: {user.email} | Dept: {user.department || 'Not set'}</p>
        </div>
        <div>
          <button onClick={() => setIsModalOpen(true)} style={{ marginRight: '10px', padding: '8px 14px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>Edit Profile</button>
          <button onClick={handleLogout} style={{ padding: '8px 14px', cursor: 'pointer', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px' }}>Logout</button>
        </div>
      </header>

      {/* Apply Leave Section */}
      <section style={{ marginTop: '25px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h3>Apply for Leave</h3>
        <form onSubmit={handleApplyLeave} style={{ display: 'grid', gap: '10px' }}>
          <div>
            <label>Start Date: </label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ padding: '6px', marginLeft: '5px' }} />
          </div>
          <div>
            <label>End Date: </label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ padding: '6px', marginLeft: '12px' }} />
          </div>
          <textarea
            placeholder="Reason for leave"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows="3"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '150px' }}>Submit Request</button>
        </form>
      </section>

      {/* Leave History */}
      <section style={{ marginTop: '30px' }}>
        <h3>My Leave History</h3>
        {leaves.length === 0 ? (
          <p>No leave requests found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Dates</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Reason</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l._id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{l.reason}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', color: l.status === 'Approved' ? 'green' : l.status === 'Rejected' ? 'red' : '#e67e22' }}>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Profile Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '320px' }}>
            <h3>Edit Profile Details</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
              <input type="text" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: '8px' }} />
              <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '8px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '6px 12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;