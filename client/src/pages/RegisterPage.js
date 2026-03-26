import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

function RegisterPage({ isDark = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Verification Step State
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      if (response.data.requiresVerification) {
        setNeedsVerification(true);
        setSuccessMsg(response.data.message);
      } else {
        // Fallback for immediate login
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authAPI.verifyEmail({ token: verifyToken });
      navigate('/login', { state: { message: 'Email verified successfully! You can now log in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
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

        {!needsVerification ? (
          <>
            <p style={{ color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center', marginBottom: '32px' }}>Create your account</p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle(isDark)} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle(isDark)} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle(isDark)} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required style={inputStyle(isDark)} />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? 'Creating...' : 'Sign Up'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
              Already have an account? <Link to="/login" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleVerify}>
            <p style={{ color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center', marginBottom: '24px' }}>Enter the verification token sent to your email (check server console).</p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: isDark ? '#f3f4f6' : '#111827', fontWeight: '500' }}>Verification Token</label>
              <input type="text" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} required style={inputStyle(isDark)} />
            </div>
            <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? 'Verifying...' : 'Verify Email'}</button>
          </form>
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

export default RegisterPage;
