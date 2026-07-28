const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['email_verify', 'password_reset', '2fa'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Automatically deletes the document after 1 hour (3600 seconds)
  },
});

module.exports = mongoose.model('Token', tokenSchema);
