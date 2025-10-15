const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// MongoDB URI (same as in database.js)
const MONGODB_URI = 'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

const resetPassword = async () => {
  try {
    // Подключение к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Новый пароль
    const newPassword = 'Mubarakway2025!';
    const username = 'admin';

    // Находим админа
    const admin = await Admin.findOne({ username });

    if (!admin) {
      console.log('❌ Admin not found!');
      console.log('Creating new admin...');

      // Создаём нового админа
      const newAdmin = new Admin({
        username: 'admin',
        email: 'admin@mubarakway.com',
        password: newPassword,
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

      await newAdmin.save();
      console.log('\n✅ New admin created successfully!');
    } else {
      // Обновляем пароль существующего админа
      admin.password = newPassword;
      await admin.save();
      console.log('\n✅ Admin password reset successfully!');
    }

    console.log('═══════════════════════════════════════');
    console.log('Username: admin');
    console.log('Password: Mubarakway2025!');
    console.log('Email: admin@mubarakway.com');
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log('🔗 Login URL: https://mubarakway-admin.onrender.com/admin/login');

    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
};

resetPassword();
