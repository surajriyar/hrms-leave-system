import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('employee'); // 'employee' ya 'admin'
  const [empCode, setEmpCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login-emp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empCode: empCode.trim(),
          password,
          role
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Selected role ke hisaab se redirect
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Backend connection error! Check if server is running.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5efe6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #dcd1be', borderRadius: '8px', width: '380px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Header Ribbon */}
        <div style={{ background: 'linear-gradient(180deg, #f39c12, #d35400)', padding: '15px 20px', color: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>HRMS Enterprise Portal</h3>
          <small style={{ opacity: 0.9 }}>Select login type to continue</small>
        </div>

        {/* Role Switcher Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          <button
            type="button"
            onClick={() => { setRole('employee'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: role === 'employee' ? '#fff' : '#f8f9fa',
              color: role === 'employee' ? '#d35400' : '#666',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: role === 'employee' ? '3px solid #d35400' : 'none'
            }}
          >
            👤 Employee Login
          </button>
          <button
            type="button"
            onClick={() => { setRole('admin'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: role === 'admin' ? '#fff' : '#f8f9fa',
              color: role === 'admin' ? '#d35400' : '#666',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: role === 'admin' ? '3px solid #d35400' : 'none'
            }}
          >
            🛡️ Admin Login
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ padding: '25px 20px', display: 'grid', gap: '15px' }}>
          {error && (
            <div style={{ background: '#fde8e8', color: '#c53030', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#444', marginBottom: '5px' }}>
              {role === 'admin' ? 'Admin ID / Username' : 'Emp Code'}
            </label>
            <input
              type="text"
              placeholder={role === 'admin' ? 'e.g. ADMIN' : 'e.g. 3132'}
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#444', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder={role === 'admin' ? 'Enter admin password' : 'Default: Emp Code'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
            {role === 'employee' && (
              <small style={{ color: '#888', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                First time login: Default password is your Emp Code
              </small>
            )}
          </div>

          <button
            type="submit"
            style={{
              background: 'linear-gradient(180deg, #ffc97a, #f39c12)',
              border: '1px solid #c97d10',
              color: '#000',
              fontWeight: 'bold',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '5px'
            }}
          >
            {role === 'admin' ? 'LOGIN AS ADMIN' : 'LOGIN AS EMPLOYEE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;