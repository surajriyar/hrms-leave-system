import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('employee');
  const [empCode, setEmpCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login-emp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setEmpCode('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-center">

      <div className="w-full max-w-md">

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-xl shadow-orange-100/50">

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-6 text-white sm:px-7">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
                🏢
              </div>

              <div className="min-w-0">
                <h1 className="text-lg font-bold sm:text-xl">
                  HRMS Enterprise Portal
                </h1>

                <p className="mt-1 text-xs text-orange-50 sm:text-sm">
                  Select login type to continue
                </p>
              </div>

            </div>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50">

            <button
              type="button"
              onClick={() => switchRole('employee')}
              className={`relative px-3 py-4 text-sm font-semibold transition sm:px-5 ${
                role === 'employee'
                  ? 'bg-white text-orange-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <span className="mr-1.5">👤</span>
              Employee Login

              {role === 'employee' && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-orange-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => switchRole('admin')}
              className={`relative px-3 py-4 text-sm font-semibold transition sm:px-5 ${
                role === 'admin'
                  ? 'bg-white text-orange-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <span className="mr-1.5">🛡️</span>
              Admin Login

              {role === 'admin' && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-orange-500" />
              )}
            </button>

          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-5 px-5 py-6 sm:px-7 sm:py-8"
          >

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                <span className="mt-0.5">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Employee/Admin ID */}
            <div>
              <label
                htmlFor="empCode"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {role === 'admin'
                  ? 'Admin ID / Username'
                  : 'Employee Code'}
              </label>

              <div className="relative">

                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {role === 'admin' ? '🛡️' : '👤'}
                </span>

                <input
                  id="empCode"
                  type="text"
                  placeholder={
                    role === 'admin'
                      ? 'e.g. ADMIN'
                      : 'e.g. 3132'
                  }
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">

                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔒
                </span>

                <input
                  id="password"
                  type="password"
                  placeholder={
                    role === 'admin'
                      ? 'Enter admin password'
                      : 'Default: Emp Code'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

              </div>

              {role === 'employee' && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                  <span>💡</span>
                  <span>
                    First time login: Default password is your Emp Code
                  </span>
                </div>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:from-orange-600 hover:to-amber-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  LOGGING IN...
                </>
              ) : (
                <>
                  {role === 'admin'
                    ? '🛡️ LOGIN AS ADMIN'
                    : '👤 LOGIN AS EMPLOYEE'}
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 text-center sm:px-7">
            <p className="text-xs text-gray-400">
              HRMS Enterprise Portal
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Secure Employee Management System
            </p>
          </div>

        </div>

        {/* Bottom Text */}
        <p className="mt-5 text-center text-xs text-gray-400">
          © 2026 HRMS Enterprise Portal. All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default Login;