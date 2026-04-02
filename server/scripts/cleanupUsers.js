require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function cleanupUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tracestackpublish');
    
    console.log('Identifying normal users...');
    const userCount = await User.countDocuments({ role: 'user' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    console.log(`Found ${userCount} normal users and ${adminCount} admins.`);
    
    if (userCount > 0) {
      const result = await User.deleteMany({ role: 'user' });
      console.log(`Successfully deleted ${result.deletedCount} normal users.`);
    } else {
      console.log('No normal users found to delete.');
    }
    
    console.log('Admin accounts preserved.');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanupUsers();
