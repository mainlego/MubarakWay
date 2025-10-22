require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Nashid = require('../models/Nashid');
const Subscription = require('../models/Subscription');
const Admin = require('../models/Admin');

async function optimizeIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Optimizing User indexes...');
    await User.collection.dropIndexes();
    await User.collection.createIndex({ telegramId: 1 }, { unique: true });
    await User.collection.createIndex({ 'subscription.tier': 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ lastActive: -1 });
    // Compound index для поиска активных пользователей с подпиской
    await User.collection.createIndex({
      'subscription.tier': 1,
      'subscription.isActive': 1
    });
    // Compound index для users с геолокацией (для prayer notifications)
    await User.collection.createIndex({
      'prayerSettings.location.latitude': 1,
      'prayerSettings.location.longitude': 1
    });
    console.log('✅ User indexes optimized');

    console.log('📚 Optimizing Book indexes...');
    if (Book) {
      try {
        await Book.collection.dropIndexes();
        await Book.collection.createIndex({ title: 1 });
        await Book.collection.createIndex({ author: 1 });
        await Book.collection.createIndex({ category: 1 });
        await Book.collection.createIndex({ accessLevel: 1 });
        await Book.collection.createIndex({ createdAt: -1 });
        // Compound index для поиска книг по категории и уровню доступа
        await Book.collection.createIndex({ category: 1, accessLevel: 1 });
        // Text index для полнотекстового поиска
        await Book.collection.createIndex({ title: 'text', author: 'text', description: 'text' });
        console.log('✅ Book indexes optimized');
      } catch (error) {
        console.log('⚠️ Book model not found or error:', error.message);
      }
    }

    console.log('🎵 Optimizing Nashid indexes...');
    if (Nashid) {
      try {
        await Nashid.collection.dropIndexes();
        await Nashid.collection.createIndex({ title: 1 });
        await Nashid.collection.createIndex({ artist: 1 });
        await Nashid.collection.createIndex({ category: 1 });
        await Nashid.collection.createIndex({ accessLevel: 1 });
        await Nashid.collection.createIndex({ createdAt: -1 });
        // Compound index
        await Nashid.collection.createIndex({ category: 1, accessLevel: 1 });
        // Text search
        await Nashid.collection.createIndex({ title: 'text', artist: 'text' });
        console.log('✅ Nashid indexes optimized');
      } catch (error) {
        console.log('⚠️ Nashid model not found or error:', error.message);
      }
    }

    console.log('💎 Optimizing Subscription indexes...');
    await Subscription.collection.dropIndexes();
    await Subscription.collection.createIndex({ tier: 1 }, { unique: true });
    await Subscription.collection.createIndex({ isActive: 1 });
    await Subscription.collection.createIndex({ order: 1 });
    // Compound index для активных подписок с порядком
    await Subscription.collection.createIndex({ isActive: 1, order: 1 });
    console.log('✅ Subscription indexes optimized');

    console.log('👨‍💼 Optimizing Admin indexes...');
    if (Admin) {
      try {
        await Admin.collection.dropIndexes();
        await Admin.collection.createIndex({ username: 1 }, { unique: true });
        await Admin.collection.createIndex({ isActive: 1 });
        await Admin.collection.createIndex({ role: 1 });
        await Admin.collection.createIndex({ createdAt: -1 });
        console.log('✅ Admin indexes optimized');
      } catch (error) {
        console.log('⚠️ Admin model not found or error:', error.message);
      }
    }

    console.log('\n🎉 All indexes optimized successfully!');
    console.log('\n📊 Index Statistics:');

    try {
      const userCount = await User.countDocuments();
      const userIndexes = await User.collection.listIndexes().toArray();
      console.log(`Users: ${userCount} documents, ${userIndexes.length} indexes`);

      const subCount = await Subscription.countDocuments();
      const subIndexes = await Subscription.collection.listIndexes().toArray();
      console.log(`Subscriptions: ${subCount} documents, ${subIndexes.length} indexes`);
    } catch (statError) {
      console.log('ℹ️ Statistics not available (this is okay)');
    }

    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error optimizing indexes:', error);
    process.exit(1);
  }
}

optimizeIndexes();
