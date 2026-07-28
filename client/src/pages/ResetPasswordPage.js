import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

function ResetPasswordPage({ isDark = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ token: '', newPassword: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await authAPI.resetPassword(formData);
      setStatus({ type: 'success', message: res.data.message });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to reset password' });
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: isDark ? '#f3f4f6' : '#111827', marginBottom: '8px', textAlign: 'center' }}>
          Create New Password
        </h1>
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center', marginBottom: '32px', fontSize: '14px' }}>
          Check your console/email for the reset token.
        </p>

        {status.message && (
          <div style={{
            backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: status.type === 'success' ? '#166534' : '#991b1b',
            padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', textAlign: 'center'
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Reset Token</label>
            <input 
              type="text" value={formData.token} onChange={(e) => setFormData({...formData, token: e.target.value})} required 
              style={inputStyle(isDark)} placeholder="Paste token here"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>New Password</label>
            <input 
              type="password" value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} required 
              style={inputStyle(isDark)} 
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '6px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>← Back to login</Link>
        </p>
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

export default ResetPasswordPage;
