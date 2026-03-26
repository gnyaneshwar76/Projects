/**
 * Sample data script for TraceStack
 * Run this to populate the database with test bugs
 * 
 * Usage: node scripts/seedData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Bug = require('../src/models/Bug');

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@tracestack.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Test User',
    email: 'user@tracestack.com',
    password: 'user123',
    role: 'user'
  }
];

const sampleBugs = [
  {
    title: 'Login button not working on mobile',
    description: 'The login button fails to respond to clicks when accessed from mobile devices. Users cannot proceed to the authentication flow.',
    stepsToReproduce: [
      'Open the website on a mobile device',
      'Navigate to the login page',
      'Tap the login button',
      'Observe no response'
    ],
    severity: 'critical',
    tags: ['mobile', 'ui', 'auth'],
    createdBy: 'alice@example.com',
  },
  {
    title: 'Sign-in fails on Android devices',
    description: 'Android users experience failure during the sign-in process. The authentication request times out.',
    stepsToReproduce: [
      'Use Android phone',
      'Navigate to login page',
      'Enter credentials',
      'Wait for 30 seconds'
    ],
    severity: 'critical',
    tags: ['mobile', 'auth', 'android'],
    createdBy: 'bob@example.com',
  },
  {
    title: 'Form validation error message unclear',
    description: 'Error messages shown during form validation are not clear and confusing to users. Need better UX.',
    stepsToReproduce: [
      'Fill form with invalid data',
      'Submit form',
      'Observe error message'
    ],
    severity: 'medium',
    tags: ['ui', 'ux', 'form'],
    createdBy: 'carol@example.com',
  },
  {
    title: 'Search feature crashes with special characters',
    description: 'The search functionality crashes when special characters are used in the search query.',
    stepsToReproduce: [
      'Go to search',
      'Enter "@#$%"',
      'Press search',
      'App crashes'
    ],
    severity: 'high',
    tags: ['search', 'crash'],
    createdBy: 'david@example.com',
  },
  {
    title: 'Dashboard loading slowly',
    description: 'The dashboard takes 10+ seconds to load, affecting user experience significantly.',
    stepsToReproduce: [
      'Navigate to dashboard',
      'Monitor load time'
    ],
    severity: 'high',
    tags: ['performance', 'dashboard'],
    createdBy: 'eve@example.com',
  },
  {
    title: 'Profile image upload broken',
    description: 'Users cannot upload profile images. Upload button is unresponsive.',
    stepsToReproduce: [
      'Go to profile settings',
      'Click upload image button',
      'Select an image',
      'Upload fails'
    ],
    severity: 'medium',
    tags: ['upload', 'profile', 'ui'],
    createdBy: 'frank@example.com',
  },
  {
    title: 'Email notification not sent',
    description: 'Users are not receiving email notifications for important events.',
    stepsToReproduce: [
      'Trigger a notification event',
      'Wait for email',
      'Email never arrives'
    ],
    severity: 'high',
    tags: ['email', 'notifications'],
    createdBy: 'grace@example.com',
  },
  {
    title: 'Dark mode toggle not working',
    description: 'The dark mode toggle switch does not actually change the theme.',
    stepsToReproduce: [
      'Go to settings',
      'Click dark mode toggle',
      'Theme does not change'
    ],
    severity: 'low',
    tags: ['ui', 'settings'],
    createdBy: 'henry@example.com',
  },
  {
    title: 'API endpoint timeout on large dataset',
    description: 'The API times out when querying large datasets with complex filters.',
    stepsToReproduce: [
      'Request data with complex query',
      'Monitor response time',
      'Timeout occurs'
    ],
    severity: 'high',
    tags: ['api', 'performance'],
    createdBy: 'iris@example.com',
  },
  {
    title: 'Keyboard shortcuts not working',
    description: 'Custom keyboard shortcuts defined in settings are not functioning.',
    stepsToReproduce: [
      'Set keyboard shortcuts',
      'Try to use them',
      'No response'
    ],
    severity: 'low',
    tags: ['accessibility', 'shortcuts'],
    createdBy: 'jack@example.com',
  },
];

const User = require('../src/models/User');

async function seedUsers() {
  console.log('Seeding users...');
  for (const userData of sampleUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.email} | role: ${userData.role}`);
    } else {
      console.log(`User already exists: ${userData.email}`);
    }
  }
}

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tracestack', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing users and bugs
    await User.deleteMany({});
    console.log('✓ Cleared existing users');
    await Bug.deleteMany({});
    console.log('✓ Cleared existing bugs');

    // Insert sample users
    await seedUsers();

    // Insert sample bugs with an existing userId
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('No admin user found for bug userId assignment');
    }

    const preparedBugs = sampleBugs.map((bugData) => ({
      ...bugData,
      userId: adminUser._id,
    }));

    const inserted = await Bug.insertMany(preparedBugs);
    console.log(`✓ Inserted ${inserted.length} sample bugs`);

    // Log inserted IDs
    console.log('\nInserted Bug IDs:');
    inserted.forEach((bug, index) => {
      console.log(`${index + 1}. ${bug.title} (${bug._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
