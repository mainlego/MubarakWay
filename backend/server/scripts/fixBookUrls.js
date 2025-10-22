/**
 * Migration Script: Fix malformed book URLs
 *
 * Fixes URLs like:
 * https://mubarakway-backend.onrender.comhttp://localhost:10000/uploads/...
 *
 * To:
 * https://mubarakway-backend.onrender.com/uploads/...
 *
 * Usage:
 *   node server/scripts/fixBookUrls.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');

const fixBookUrls = async () => {
  try {
    console.log('🔧 Starting Book URL fix...\n');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all books
    const books = await Book.find({});
    console.log(`📊 Found ${books.length} books total\n`);

    let fixed = 0;
    let errors = 0;

    for (const book of books) {
      let needsUpdate = false;
      const updates = {};

      // Fix cover URL
      if (book.cover && book.cover.includes('http://localhost')) {
        const fixedCover = book.cover.replace(/https:\/\/mubarakway-backend\.onrender\.comhttp:\/\/localhost:\d+/, 'https://mubarakway-backend.onrender.com');
        updates.cover = fixedCover;
        needsUpdate = true;
        console.log(`📸 Fixing cover for "${book.title}"`);
        console.log(`   Old: ${book.cover.substring(0, 80)}...`);
        console.log(`   New: ${fixedCover}`);
      }

      // Fix content URL
      if (book.content && book.content.includes('http://localhost')) {
        const fixedContent = book.content.replace(/https:\/\/mubarakway-backend\.onrender\.comhttp:\/\/localhost:\d+/, 'https://mubarakway-backend.onrender.com');
        updates.content = fixedContent;
        needsUpdate = true;
        console.log(`📄 Fixing content for "${book.title}"`);
        console.log(`   Old: ${book.content.substring(0, 80)}...`);
        console.log(`   New: ${fixedContent}`);
      }

      if (needsUpdate) {
        try {
          await Book.findByIdAndUpdate(book._id, updates);
          console.log(`✅ Fixed: "${book.title}"\n`);
          fixed++;
        } catch (error) {
          console.error(`❌ Failed to update "${book.title}":`, error.message);
          errors++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully fixed: ${fixed} books`);
    console.log(`⏭️  Skipped (already OK): ${books.length - fixed - errors} books`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📚 Total books in DB: ${books.length}`);
    console.log('='.repeat(60) + '\n');

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
fixBookUrls();
