const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email_verify', '2fa', 'password_reset'],
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Automatically delete document after 10 minutes (600 seconds)
  }
});

// Avoid compiling the model twice if it already exists
module.exports = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
