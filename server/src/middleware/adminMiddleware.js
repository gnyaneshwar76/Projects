const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // We already attach 'role' in the JWT via authController, but we double-check the DB
    const user = await User.findById(decoded.id).select('role isBanned');
    if (!user) {
      return res.status(401).json({ error: 'User does not exist' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = { adminMiddleware };
