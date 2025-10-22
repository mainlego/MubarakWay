require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function createAdmin() {
  try {
    // Get MongoDB URI from parent directory .env
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin already exists');
      process.exit(0);
    }

    // Create admin
    const admin = new Admin({
      username: 'admin',
      email: 'admin@mubarakway.com',
      password: 'admin123',
      role: 'admin',
      permissions: {
        canManageBooks: true,
        canManageNashids: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageAdmins: true
      },
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin created successfully');
    console.log('📧 Email: admin@mubarakway.com');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
