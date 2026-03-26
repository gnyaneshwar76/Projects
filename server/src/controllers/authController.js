const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { sendEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to generate a random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to get location and device info
const getLocationAndDevice = async (req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  let location = 'Unknown Location';
  
  try {
    // Only call ipapi if it's a real IP, not local
    if (ip !== '127.0.0.1' && ip !== '::1') {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
      if (response.data && response.data.city && response.data.country_name) {
        location = `${response.data.city}, ${response.data.country_name}`;
      }
    }
  } catch (err) {
    console.error('IPAPI lookup failed:', err.message);
  }

  const device = req.headers['user-agent'] || 'Unknown Device';
  return { location, device, time: new Date().toLocaleString() };
};

// ─── REGISTER ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const user = new User({ name, email: normalizedEmail, password });
    await user.save();

    // Create 6-digit Email Verification OTP
    const otpCode = generateOTP();
    await new OTP({ userId: user._id, otp: otpCode, type: 'email_verify' }).save();

    // Send Verification Email
    await sendEmail({
      to: user.email,
      subject: 'Verify your TraceStack Account',
      html: `
        <h3>Welcome to TraceStack, ${user.name}!</h3>
        <p>Your 6-digit email verification code is:</p>
        <h2 style="color: #4f46e5; letter-spacing: 2px;">${otpCode}</h2>
        <p>This code expires in 10 minutes. Please enter it to verify your account.</p>
      `
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email for the OTP.',
      requiresVerification: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    // We accept 'otp' from the new frontend input (or 'token' if sending as fallback)
    const otpInput = req.body.otp || req.body.token;
    if (!otpInput) return res.status(400).json({ error: 'OTP is required' });

    const otpDoc = await OTP.findOne({ otp: otpInput, type: 'email_verify' });
    if (!otpDoc) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Increment attempts (optional logic, but typically you'd query by userId and then check OTP to increment attempts on failures. Since we found the doc by OTP, it's correct)
    const user = await User.findById(otpDoc.userId);
    if (!user) return res.status(400).json({ error: 'User not found' });

    user.isEmailVerified = true;
    await user.save();
    
    // Clear all email verify OTPs for this user
    await OTP.deleteMany({ userId: user._id, type: 'email_verify' });

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
};

// ─── LOGIN & 2FA ──────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isBanned) return res.status(403).json({ error: 'This account has been banned.' });
    if (!user.isEmailVerified) return res.status(403).json({ error: 'Please verify your email via the OTP sent to your inbox.' });

    const telemetry = await getLocationAndDevice(req);

    // Handle 2FA Verification Optional
    if (user.is2FAEnabled) {
      await OTP.deleteMany({ userId: user._id, type: '2fa' });
      const otpCode = generateOTP();
      await new OTP({ userId: user._id, otp: otpCode, type: '2fa' }).save();
      
      await sendEmail({
        to: user.email,
        subject: 'New Login Detected – TraceStack',
        html: `
          <h3>Hi ${user.name},</h3>
          <p>We detected a login attempt on your account.</p>
          <ul>
            <li><strong>Location:</strong> ${telemetry.location}</li>
            <li><strong>Device:</strong> ${telemetry.device}</li>
            <li><strong>Time:</strong> ${telemetry.time}</li>
          </ul>
          <p>Your OTP:</p>
          <h2 style="color: #4f46e5; letter-spacing: 2px;">${otpCode}</h2>
          <p>If this was you, continue login.<br/>If not, reset your password immediately.</p>
        `
      });

      return res.json({ require2FA: true, message: '2FA code sent to your email.' });
    }

    // Standard Login (Send non-OTP alert)
    await sendEmail({
      to: user.email,
      subject: 'New Login Detected – TraceStack',
      html: `
        <h3>Hi ${user.name},</h3>
        <p>A successful login was just made to your account.</p>
        <ul>
          <li><strong>Location:</strong> ${telemetry.location}</li>
          <li><strong>Device:</strong> ${telemetry.device}</li>
          <li><strong>Time:</strong> ${telemetry.time}</li>
        </ul>
        <p>If this was you, you can safely ignore this email.<br/>If not, please reset your password immediately.</p>
      `
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

const verify2FA = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid request' });

    // Find the latest 2FA attempt for this user
    const otpDoc = await OTP.findOne({ userId: user._id, type: '2fa' }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(401).json({ error: 'No active 2FA request found' });

    // Validate OTP matching
    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      
      if (otpDoc.attempts >= 5) {
        await OTP.deleteMany({ userId: user._id, type: '2fa' });
        return res.status(401).json({ error: 'Too many failed attempts. Please login again.' });
      }
      return res.status(401).json({ error: `Invalid 2FA code. Attempts left: ${5 - otpDoc.attempts}` });
    }

    // Valid OTP
    await OTP.deleteMany({ userId: user._id, type: '2fa' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: '2FA verified. Login successful.', token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: '2FA verification failed', details: error.message });
  }
};

const toggle2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.is2FAEnabled = !user.is2FAEnabled;
    await user.save();
    res.json({ message: `2FA has been ${user.is2FAEnabled ? 'enabled' : 'disabled'}`, is2FAEnabled: user.is2FAEnabled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle 2FA', details: error.message });
  }
};

// ─── PASSWORD RESET ───────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'If that email exists, an OTP has been sent.' });

    // Clear old reset tokens
    await OTP.deleteMany({ userId: user._id, type: 'password_reset' });

    const otpCode = generateOTP();
    await new OTP({ userId: user._id, otp: otpCode, type: 'password_reset' }).save();

    await sendEmail({
      to: user.email,
      subject: 'TraceStack - Password Reset OTP',
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Use this OTP to reset your password:</p>
        <h2 style="color: #4f46e5; letter-spacing: 2px;">${otpCode}</h2>
        <p>This OTP expires in 10 minutes.</p>
      `
    });

    res.json({ message: 'If that email exists, an OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Forgot password failed', details: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // Assume frontend sends the OTP in the 'token' field based on old code
    if (!token || !newPassword) return res.status(400).json({ error: 'OTP and new password required' });

    const otpDoc = await OTP.findOne({ otp: token, type: 'password_reset' });
    if (!otpDoc) return res.status(400).json({ error: 'Invalid or expired reset OTP' });

    const user = await User.findById(otpDoc.userId);
    user.password = newPassword;
    await user.save();
    await OTP.deleteMany({ userId: user._id, type: 'password_reset' });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed', details: error.message });
  }
};

// ─── PROFILE VIEWS ────────────────────────────────────────────────────────
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const Bug = require('../models/Bug');
    const totalBugs = await Bug.countDocuments({ userId });
    const bugsSolved = await Bug.countDocuments({ userId, isSolved: true });

    let badge = 'Beginner';
    if (user.reputation >= 100) badge = 'Expert';
    else if (user.reputation >= 30) badge = 'Contributor';

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      reputation: user.reputation || 0,
      badge,
      totalBugs,
      bugsSolved,
      createdAt: user.createdAt,
      is2FAEnabled: user.is2FAEnabled
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (bio !== undefined) user.bio = bio.slice(0, 200);
    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  register, verifyEmail, login, verify2FA, toggle2FA, 
  forgotPassword, resetPassword, 
  getCurrentUser, getUserProfile, updateProfile 
};
