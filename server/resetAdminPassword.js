require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function resetPassword() {
  try {
    // Get MongoDB URI
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find admin
    const admin = await Admin.findOne({ username: 'admin' });

    if (!admin) {
      console.log('❌ Admin not found');
      process.exit(1);
    }

    // Update password
    admin.password = 'admin123';
    await admin.save();

    console.log('✅ Password updated successfully');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');

    // Test new password
    const isValid = await admin.comparePassword('admin123');
    console.log('🔍 Testing new password:', isValid ? '✅ Valid' : '❌ Invalid');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetPassword();
