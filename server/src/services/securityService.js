const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../../logs');
const SECURITY_LOG_FILE = path.join(LOGS_DIR, 'security.log');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}

/**
 * Log a security event to a file and console
 * @param {string} event - Event name (e.g., AUTH_FAIL, LOCKOUT)
 * @param {object} details - Contextual information (email, IP, device, etc.)
 */
const logSecurityEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...details
  };

  const logString = JSON.stringify(logEntry) + '\n';

  // Append to file
  fs.appendFile(SECURITY_LOG_FILE, logString, (err) => {
    if (err) console.error('Failed to write to security log:', err);
  });

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SECURITY EVENT] ${event}:`, details);
  }
};

module.exports = {
  logSecurityEvent,
  EVENTS: {
    AUTH_SUCCESS: 'AUTH_SUCCESS',
    AUTH_FAIL: 'AUTH_FAIL',
    OTP_FAIL: 'OTP_FAIL',
    OTP_SUCCESS: 'OTP_SUCCESS',
    ACCOUNT_LOCKOUT: 'ACCOUNT_LOCKOUT',
    PASSKEY_REG_SUCCESS: 'PASSKEY_REG_SUCCESS',
    PASSKEY_AUTH_SUCCESS: 'PASSKEY_AUTH_SUCCESS',
    PASSWORD_RESET_REQ: 'PASSWORD_RESET_REQ',
    PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
  }
};
