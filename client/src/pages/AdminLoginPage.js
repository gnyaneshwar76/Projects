import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

function AdminLoginPage({ isDark = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(formData);

      if (response.data?.user?.role !== 'admin') {
        setError('Access denied: admin credentials required');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Reload to trigger App.js auth state update
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: isDark ? '#0f172a' : '#f3f4f6',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '1px solid #374151' : 'none',
        borderRadius: '12px',
        padding: '48px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>
            🔐 Admin Login
          </div>
          <p style={{
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px'
          }}>
            Access the administrative panel
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#e5e7eb' : '#374151',
              marginBottom: '8px'
            }}>
              Admin Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: isDark ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: isDark ? '#374151' : '#ffffff',
                color: isDark ? '#f9fafb' : '#111827',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="admin@bugradar.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#e5e7eb' : '#374151',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: isDark ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: isDark ? '#374151' : '#ffffff',
                color: isDark ? '#f9fafb' : '#111827',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="Enter admin password"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: loading ? '#9ca3af' : '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            to="/login"
            style={{
              color: isDark ? '#60a5fa' : '#3b82f6',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;