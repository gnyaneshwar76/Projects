const mongoose = require('mongoose');
const User = require('./src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bugradarpublish', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const u = await User.findOne({ email: 'admin@bugradar.com' }).lean();
    console.log('user:', u);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();