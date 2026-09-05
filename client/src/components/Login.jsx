import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '781582920391-n1g2a0eud2i0kqchlrbtqjou3ssgln4n.apps.googleusercontent.com';

const Login = () => {
  const navigate = useNavigate();

  const handleCredentialResponse = async (response) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login Error:', err);
      alert('Login me error aayi. Please check backend connection.');
    }
  };

  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById('googleSignInBtn'),
        { theme: 'outline', size: 'large', width: '280' }
      );
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', background: '#fff' }}>
        <h2 style={{ marginBottom: '10px', color: '#333' }}>HRMS Leave Management</h2>
        <p style={{ color: '#666', marginBottom: '25px' }}>Sign in with your company Google account</p>
        <div id="googleSignInBtn" style={{ display: 'flex', justifyContent: 'center' }}></div>
      </div>
    </div>
  );
};

export default Login;