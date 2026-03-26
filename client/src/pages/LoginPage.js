import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';

function LoginPage({ isDark = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  
  // 2FA State
  const [needs2FA, setNeeds2FA] = useState(false);
  const [otp, setOtp] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.require2FA) {
        setNeeds2FA(true);
        setSuccessMsg(response.data.message);
      } else {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.verify2FA({ email: formData.email, otp });
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: isDark ? '#0f172a' : '#f3f4f6', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '1px solid #374151' : 'none',
        borderRadius: '12px', padding: '48px', width: '100%', maxWidth: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: isDark ? '#f3f4f6' : '#111827', marginBottom: '8px', textAlign: 'center' }}>
          🐛 BugRadar
        </h1>
        
        {successMsg && !error && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {!needs2FA ? (
          <>
            <p style={{ color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center', marginBottom: '32px' }}>Sign in to your account</p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle(isDark)} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle(isDark)} />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? 'Signing in...' : 'Sign In'}</button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerify2FA}>
            <p style={{ color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center', marginBottom: '24px' }}>Two-Factor Authentication is enabled. Enter the 6-digit code sent to your email.</p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>6-Digit OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required style={inputStyle(isDark)} placeholder="123456" />
            </div>
            <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? 'Verifying...' : 'Verify & Login'}</button>
          </form>
        )}

        {!needs2FA && (
          <p style={{ textAlign: 'center', marginTop: '20px', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
            Don't have an account? <Link to="/register" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle = (isDark) => ({
  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
  border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
  borderRadius: '6px', backgroundColor: isDark ? '#111827' : '#ffffff',
  color: isDark ? '#f3f4f6' : '#111827', fontSize: '14px'
});

const btnStyle = (loading) => ({
  width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white',
  border: 'none', borderRadius: '6px', fontWeight: '600',
  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
});

export default LoginPage;
