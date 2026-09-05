import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const token = localStorage.getItem('token');

  const fetchAllLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaves/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLeaves(data);
    } catch (err) {
      console.error('Error fetching all leaves:', err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
    } else {
      fetchAllLeaves();
    }
  }, [token]);

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
        alert('Failed to update leave status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
        <div>
          <h2>Admin Leave Management Portal 🛡️</h2>
          <p style={{ margin: 0, color: '#666' }}>Review and approve/reject all employee requests</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 14px', cursor: 'pointer', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px' }}>Logout</button>
      </header>

      <section style={{ marginTop: '25px' }}>
        <h3>All Employee Leave Requests</h3>
        {leaves.length === 0 ? (
          <p>No leaves pending or found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Employee</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Dates</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Reason</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Current Status</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l._id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <strong>{l.user?.name || 'Employee'}</strong><br />
                    <small style={{ color: '#666' }}>{l.user?.email}</small>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{l.reason}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: l.status === 'Approved' ? 'green' : l.status === 'Rejected' ? 'red' : '#e67e22' }}>
                    {l.status}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {l.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleUpdateStatus(l._id, 'Approved')} style={{ padding: '6px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleUpdateStatus(l._id, 'Rejected')} style={{ padding: '6px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                      </div>
                    ) : (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>Decided</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;