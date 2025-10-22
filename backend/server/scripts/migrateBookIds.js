/**
 * Migration Script: Add bookId field to existing Books
 *
 * This script adds numeric bookId to all existing books that don't have one.
 * Run this once after deploying the bookId schema change.
 *
 * Usage:
 *   node server/scripts/migrateBookIds.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');

const migrateBookIds = async () => {
  try {
    console.log('🔄 Starting Book ID migration...\n');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all books without bookId
    const booksWithoutId = await Book.find({ bookId: { $exists: false } });
    console.log(`📊 Found ${booksWithoutId.length} books without bookId\n`);

    if (booksWithoutId.length === 0) {
      console.log('✅ All books already have bookId field!\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get the highest existing bookId
    const bookWithHighestId = await Book.findOne({ bookId: { $exists: true } })
      .sort({ bookId: -1 })
      .limit(1);

    let nextBookId = bookWithHighestId ? bookWithHighestId.bookId + 1 : 1;
    console.log(`🔢 Starting bookId from: ${nextBookId}\n`);

    // Update each book
    let updated = 0;
    let errors = 0;

    for (const book of booksWithoutId) {
      try {
        book.bookId = nextBookId;
        await book.save();

        console.log(`✅ Book "${book.title}" assigned bookId: ${nextBookId}`);
        updated++;
        nextBookId++;
      } catch (error) {
        console.error(`❌ Failed to update "${book.title}":`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} books`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📚 Total books in DB: ${await Book.countDocuments()}`);
    console.log('='.repeat(60) + '\n');

    // Verify all books now have bookId
    const remainingWithoutId = await Book.countDocuments({ bookId: { $exists: false } });
    if (remainingWithoutId === 0) {
      console.log('✅ SUCCESS: All books now have bookId field!\n');
    } else {
      console.warn(`⚠️  WARNING: ${remainingWithoutId} books still missing bookId\n`);
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');

    process.exit(errors > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run migration
migrateBookIds();
