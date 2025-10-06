const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// MongoDB URI (same as in database.js)
const MONGODB_URI = 'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

const createAdmin = async () => {
  try {
    // Подключение к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Данные админа
    const adminData = {
      username: 'admin',
      email: 'admin@mubarakway.com',
      password: 'Mubarakway2025!', // Будет захеширован автоматически
      role: 'admin',
      permissions: {
        canManageBooks: true,
        canManageNashids: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageAdmins: true
      },
      isActive: true
    };

    // Проверяем, существует ли админ
    const existingAdmin = await Admin.findOne({ username: adminData.username });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
    } else {
      // Создаём админа
      const admin = new Admin(adminData);
      await admin.save();

      console.log('\n✅ Admin created successfully!');
      console.log('═══════════════════════════════════════');
      console.log('Username:', adminData.username);
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
      console.log('Role:', adminData.role);
      console.log('═══════════════════════════════════════');
      console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
      console.log('🔗 Login URL: http://localhost:5173/admin/login');
    }

    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
