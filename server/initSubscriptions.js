require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('./models/Subscription');

const defaultSubscriptions = [
  {
    tier: 'muslim',
    name: 'Muslim (Бесплатно)',
    description: 'Базовый доступ к платформе',
    price: {
      amount: 0,
      currency: 'RUB',
      period: 'lifetime'
    },
    limits: {
      booksOffline: 3,
      booksFavorites: 10,
      nashidsOffline: 5,
      nashidsFavorites: 15
    },
    access: {
      freeContent: true,
      proContent: false,
      premiumContent: false
    },
    features: {
      offlineMode: true,
      adFree: false,
      prioritySupport: false,
      earlyAccess: false
    },
    isActive: true,
    order: 1
  },
  {
    tier: 'mutahsin',
    name: 'Mutahsin (Pro)',
    description: 'Расширенный доступ и больше возможностей',
    price: {
      amount: 299,
      currency: 'RUB',
      period: 'monthly'
    },
    limits: {
      booksOffline: 20,
      booksFavorites: 50,
      nashidsOffline: 30,
      nashidsFavorites: 100
    },
    access: {
      freeContent: true,
      proContent: true,
      premiumContent: false
    },
    features: {
      offlineMode: true,
      adFree: true,
      prioritySupport: false,
      earlyAccess: true
    },
    isActive: true,
    order: 2
  },
  {
    tier: 'sahib',
    name: 'Sahib (Premium)',
    description: 'Полный доступ ко всем материалам',
    price: {
      amount: 599,
      currency: 'RUB',
      period: 'monthly'
    },
    limits: {
      booksOffline: -1, // Безлимит
      booksFavorites: -1, // Безлимит
      nashidsOffline: -1, // Безлимит
      nashidsFavorites: -1 // Безлимит
    },
    access: {
      freeContent: true,
      proContent: true,
      premiumContent: true
    },
    features: {
      offlineMode: true,
      adFree: true,
      prioritySupport: true,
      earlyAccess: true
    },
    isActive: true,
    order: 3
  }
];

async function initSubscriptions() {
  try {
    // Get MongoDB URI
    const MONGODB_URI = process.env.MONGODB_URI ||
      'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if subscriptions already exist
    const existingCount = await Subscription.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} subscriptions already exist`);
      console.log('Do you want to reset them? This will delete all existing subscriptions.');
      process.exit(0);
    }

    // Create default subscriptions
    for (const subData of defaultSubscriptions) {
      const subscription = new Subscription(subData);
      await subscription.save();
      console.log(`✅ Created subscription: ${subscription.name}`);
    }

    console.log('\n🎉 All subscriptions initialized successfully!');
    console.log('\nDefault subscription tiers:');
    console.log('1. Muslim (Free) - Basic access');
    console.log('2. Mutahsin (Pro) - Extended access');
    console.log('3. Sahib (Premium) - Full access');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing subscriptions:', error);
    process.exit(1);
  }
}

initSubscriptions();
