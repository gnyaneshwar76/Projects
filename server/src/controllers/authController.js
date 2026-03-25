const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const user = new User({ name, email: normalizedEmail, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('[LOGIN] Attempt', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
};

// Get user profile with stats
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
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update own profile (bio)
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

module.exports = { register, login, getCurrentUser, getUserProfile, updateProfile };
