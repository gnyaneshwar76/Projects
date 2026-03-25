import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

function RegisterPage({ isDark = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      // Store token and user info
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Reload to trigger App.js auth state update
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: isDark ? '#f3f4f6' : '#111827',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          🐛 BugRadar
        </h1>
        <p style={{
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Create your account
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: isDark ? '#f3f4f6' : '#111827',
              fontWeight: '500'
            }}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: isDark ? '#f3f4f6' : '#111827',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: isDark ? '#f3f4f6' : '#111827',
              fontWeight: '500'
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
                padding: '10px 12px',
                border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: isDark ? '#f3f4f6' : '#111827',
              fontWeight: '500'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '14px'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
