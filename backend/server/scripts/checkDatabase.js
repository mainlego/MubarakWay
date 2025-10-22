const mongoose = require('mongoose');
const Book = require('../models/Book');
const Nashid = require('../models/Nashid');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/islam-bot';

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check books
    console.log('📚 CHECKING BOOKS:');
    console.log('='.repeat(50));
    const totalBooks = await Book.countDocuments();
    console.log(`Total books in database: ${totalBooks}`);

    if (totalBooks > 0) {
      const books = await Book.find().limit(5).select('bookId title author category genre isPro');
      console.log('\nFirst 5 books:');
      books.forEach(book => {
        console.log(`  - ID: ${book.bookId}, Title: "${book.title}", Author: "${book.author || 'N/A'}"`);
        console.log(`    Category: ${book.category}, Genre: ${book.genre}, Pro: ${book.isPro}`);
      });

      // Check for books without bookId
      const booksWithoutId = await Book.find({ bookId: { $exists: false } });
      if (booksWithoutId.length > 0) {
        console.log(`\n⚠️ WARNING: ${booksWithoutId.length} books without bookId field!`);
      }
    } else {
      console.log('⚠️ No books found in database!');
    }

    // Check nashids
    console.log('\n\n🎵 CHECKING NASHIDS:');
    console.log('='.repeat(50));
    const totalNashids = await Nashid.countDocuments();
    console.log(`Total nashids in database: ${totalNashids}`);

    if (totalNashids > 0) {
      const nashids = await Nashid.find().limit(5).select('nashidId title artist category language accessLevel');
      console.log('\nFirst 5 nashids:');
      nashids.forEach(nashid => {
        console.log(`  - ID: ${nashid.nashidId || 'MISSING'}, Title: "${nashid.title}", Artist: "${nashid.artist}"`);
        console.log(`    Category: ${nashid.category}, Language: ${nashid.language}, Access: ${nashid.accessLevel}`);
      });

      // Check for nashids without nashidId
      const nashidsWithoutId = await Nashid.find({ nashidId: { $exists: false } });
      if (nashidsWithoutId.length > 0) {
        console.log(`\n⚠️ WARNING: ${nashidsWithoutId.length} nashids without nashidId field!`);
        console.log('These nashids need to be updated with nashidId values');
      }
    } else {
      console.log('⚠️ No nashids found in database!');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkDatabase();
