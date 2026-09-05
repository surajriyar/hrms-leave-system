import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchAllLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/leaves/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized or failed to fetch');
      const data = await res.json();
      setLeaves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAllLeaves();
  }, [token]);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/leaves/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setLeaves((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status } : l))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredLeaves = filter === 'All' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Bar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '700'
          }}>A</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Admin Console</h1>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Leave Operations & Approvals</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>Admin</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{user.name}</div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 14px',
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

      {/* Main Section */}
      <main style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: filter === status ? '#fff' : 'transparent',
                  color: filter === status ? '#0f172a' : '#64748b',
                  boxShadow: filter === status ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAllLeaves}
            style={{ padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#334155' }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Requests Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading records...</div>
          ) : filteredLeaves.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No requests match the current filter.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px' }}>Employee</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px' }}>Reason</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '14px 20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((l) => {
                  const statusConfig = {
                    Pending: { bg: '#fffbeb', text: '#b45309' },
                    Approved: { bg: '#ecfdf5', text: '#047857' },
                    Rejected: { bg: '#fef2f2', text: '#b91c1c' }
                  }[l.status] || { bg: '#f1f5f9', text: '#475569' };

                  return (
                    <tr key={l._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{l.applicantName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{l.applicantEmail}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: '#334155' }}>
                        {l.days} {l.days === 1 ? 'day' : 'days'}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#334155', maxWidth: '300px' }}>
                        {l.reason}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: statusConfig.bg,
                          color: statusConfig.text
                        }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {l.status === 'Pending' ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleStatusUpdate(l._id, 'Approved')}
                              style={{
                                padding: '6px 14px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(l._id, 'Rejected')}
                              style={{
                                padding: '6px 14px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}