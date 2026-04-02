const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // Security & Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  
  // 2FA / OTP (Hashed)
  otp: String,
  otpExpiry: Date,
  otpAttempts: {
    type: Number,
    default: 0,
  },
  otpBlockedUntil: Date,
  
  // Password Reset (Hashed)
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  
  // Session Security
  tokenVersion: {
    type: Number,
    default: 0,
  },
  lastLoginIP: String,
  lastLoginDevice: String,

  // WebAuthn Passkeys
  passkeys: [{
    credentialID: Buffer,
    publicKey: Buffer,
    counter: Number,
    transports: [String],
    deviceType: String,
    backedUp: Boolean,
    createdAt: { type: Date, default: Date.now }
  }],

  // Social/Features
  reputation: {
    type: Number,
    default: 0,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200,
  },
  is2FAEnabled: {
    type: Boolean,
    default: false,
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug',
  }],
  isBanned: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
