const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vladmelbiz:xMnlBJJFDtcdDGqU@tg-game-2.zsxexae.mongodb.net/islam-bot?retryWrites=true&w=majority&appName=tg-game-2';

async function clearBooks() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const booksCollection = mongoose.connection.collection('books');

    // Удаляем все книги
    const result = await booksCollection.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} books from database`);

    console.log('✅ Books collection cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearBooks();
