const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb://localhost:27017/bugradar';

mongoose.connect(MONGO_URI)
  .then(async () => {
    let admin = await User.findOne({ email: 'admin@bugradar.com' });
    if (!admin) {
      admin = new User({
        name: 'System Admin',
        email: 'admin@bugradar.com',
        password: 'adminpassword',
        role: 'admin' // explicitly set role
      });
      await admin.save();
      console.log('✅ Admin user created successfully!\nEmail: admin@bugradar.com\nPassword: adminpassword');
    } else {
      admin.role = 'admin'; // ensure role is admin
      admin.password = 'adminpassword';
      await admin.save();
      console.log('✅ Admin user already exists and was updated!\nEmail: admin@bugradar.com\nPassword: adminpassword');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
