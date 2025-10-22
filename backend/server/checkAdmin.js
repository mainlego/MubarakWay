require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function checkAdmin() {
  try {
    // Get MongoDB URI from parent directory .env
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find({});
    console.log('\n📋 Found', admins.length, 'admins:');

    admins.forEach(admin => {
      console.log('\n👤 Admin:', {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        permissions: admin.permissions,
        passwordHash: admin.password.substring(0, 20) + '...'
      });
    });

    // Test password
    if (admins.length > 0) {
      const admin = admins[0];
      const testPassword = 'admin123';
      const isValid = await admin.comparePassword(testPassword);
      console.log('\n🔑 Testing password "admin123":', isValid ? '✅ Valid' : '❌ Invalid');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmin();
