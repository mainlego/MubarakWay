const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

async function clearNashids() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const nashidsCollection = mongoose.connection.collection('nashids');

    // Удаляем все нашиды
    const result = await nashidsCollection.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} nashids from database`);

    console.log('✅ Nashids collection cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearNashids();
