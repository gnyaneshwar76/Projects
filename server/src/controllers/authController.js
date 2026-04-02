const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcryptjs = require('bcryptjs');
const axios = require('axios');
const { sendEmail } = require('../services/emailService');
const { logSecurityEvent, EVENTS } = require('../services/securityService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_URL = 'http://localhost:3000';

// Helpers
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getLocationAndDevice = async (req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  let location = 'Unknown Location';
  try {
    if (ip !== '127.0.0.1' && ip !== '::1') {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
      if (response.data && response.data.city && response.data.country_name) {
        location = `${response.data.city}, ${response.data.region || ''}, ${response.data.country_name}`;
      }
    }
  } catch (err) {
    console.error('IPAPI lookup failed:', err.message);
  }
  const device = req.headers['user-agent'] || 'Unknown Device';
  return { ip, location, device, time: new Date().toLocaleString() };
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

    // Generate Verification Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);

    const user = new User({
      name,
      email: normalizedEmail,
      password, // Pre-save hook handles hashing
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    await user.save();

    // Send Verification Link
    const verificationLink = `${FRONTEND_URL}/verify-email/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your TraceStack Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #4f46e5;">Welcome to TraceStack, ${user.name}!</h2>
          <p>Please click the button below to activate your account and start tracking bugs:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify My Account</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `
    });

    res.status(201).json({ message: 'Registration successful! Please check your email for the verification link.' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({ message: 'Account verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
};

// ─── LOGIN & 2FA ──────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.comparePassword(password))) {
      logSecurityEvent(EVENTS.AUTH_FAIL, { email: normalizedEmail, reason: 'Invalid credentials', ...await getLocationAndDevice(req) });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isBanned) {
      logSecurityEvent(EVENTS.SUSPICIOUS_ACTIVITY, { email: normalizedEmail, reason: 'Banned user login attempt' });
      return res.status(403).json({ error: 'This account has been banned.' });
    }
    
    if (!user.isVerified) {
      logSecurityEvent(EVENTS.AUTH_FAIL, { email: normalizedEmail, reason: 'Unverified account' });
      return res.status(403).json({ error: 'Please verify your email address first.' });
    }

    // Generate 6-digit OTP
    const otpCode = generateOTP();
    const hashedOTP = hashToken(otpCode);

    user.otp = hashedOTP;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.otpAttempts = 0; 
    await user.save();

    // Send OTP Email
    await sendEmail({
      to: user.email,
      subject: 'TraceStack - Login Verification Code',
      html: `
        <div style="font-family: sans-serif; text-align: center;">
          <h2 style="color: #4f46e5;">Verification Code</h2>
          <p>Your TraceStack login code is:</p>
          <h1 style="font-size: 48px; letter-spacing: 10px; color: #1e1b4b; background: #f3f4f6; padding: 20px; display: inline-block; border-radius: 10px;">${otpCode}</h1>
          <p style="color: #6b7280; margin-top: 20px;">This code expires in 5 minutes.</p>
        </div>
      `
    });

    res.json({ step: 2, message: 'OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ error: 'Login initiation failed', details: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ error: 'Invalid request' });

    // Check if blocked
    if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
      const waitTime = Math.ceil((user.otpBlockedUntil - Date.now()) / 1000 / 60);
      return res.status(403).json({ error: `Too many attempts. Blocked for ${waitTime} more minutes.` });
    }

    const hashedInput = hashToken(otp);

    // Verify OTP
    if (user.otp !== hashedInput || !user.otpExpiry || user.otpExpiry < Date.now()) {
      user.otpAttempts += 1;
      logSecurityEvent(EVENTS.OTP_FAIL, { email: normalizedEmail, attempts: user.otpAttempts, ...await getLocationAndDevice(req) });
      
      if (user.otpAttempts >= 5) {
        user.otpBlockedUntil = Date.now() + 15 * 60 * 1000; // 15 min block
        user.otp = undefined;
        user.otpExpiry = undefined;
        logSecurityEvent(EVENTS.ACCOUNT_LOCKOUT, { email: normalizedEmail, reason: 'Too many OTP failures' });
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid or expired OTP code' });
    }

    // Success
    const telemetry = await getLocationAndDevice(req);
    logSecurityEvent(EVENTS.OTP_SUCCESS, { email: normalizedEmail, ...telemetry });
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    user.lastLoginIP = telemetry.ip;
    user.lastLoginDevice = telemetry.device;
    await user.save();

    // Issue JWT with Token Versioning for safe logout/reset
    const token = jwt.sign(
      { id: user._id, version: user.tokenVersion || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'OTP verification failed', details: error.message });
  }
};

// ─── PASSWORD RESET ───────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetLink = `${FRONTEND_URL}/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'TraceStack - Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #e11d48;">Password Reset</h2>
          <p>We received a request to reset your TraceStack password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="padding: 12px 24px; background: #e11d48; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link is valid for 15 minutes. If you didn't request a reset, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Process failed', details: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

    user.password = newPassword; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all existing sessions
    await user.save();

    logSecurityEvent(EVENTS.PASSWORD_RESET_SUCCESS, { email: user.email });

    res.json({ message: 'Password updated successfully! All previous sessions have been logged out for safety.' });
  } catch (error) {
    res.status(500).json({ error: 'Reset failed', details: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLoginIP: user.lastLoginIP,
        lastLoginDevice: user.lastLoginDevice
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -otp -emailVerificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};

module.exports = { 
  register, verifyEmail, login, verifyOTP, 
  forgotPassword, resetPassword, getCurrentUser,
  getUserProfile, updateProfile
};
