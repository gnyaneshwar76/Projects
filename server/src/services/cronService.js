const cron = require('node-cron');
const User = require('../models/User');

/**
 * Scheduled jobs for database maintenance
 */
const initCronJobs = () => {
  // Run every hour to clean up expired security tokens and OTPs
  cron.schedule('0 * * * *', async () => {
    console.log('Running security cleanup job...');
    try {
      const now = new Date();
      
      // Clear expired verification tokens
      await User.updateMany(
        { emailVerificationExpiry: { $lt: now } },
        { $unset: { emailVerificationToken: 1, emailVerificationExpiry: 1 } }
      );

      // Clear expired reset tokens
      await User.updateMany(
        { resetPasswordExpiry: { $lt: now } },
        { $unset: { resetPasswordToken: 1, resetPasswordExpiry: 1 } }
      );

      // Clear expired OTPs
      await User.updateMany(
        { otpExpiry: { $lt: now } },
        { $unset: { otp: 1, otpExpiry: 1 } }
      );

      console.log('Security cleanup completed successfully.');
    } catch (error) {
      console.error('Security cleanup job failed:', error);
    }
  });
};

module.exports = { initCronJobs };
