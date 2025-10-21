const mongoose = require('mongoose');
const Nashid = require('../models/Nashid');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/islam-bot';

async function fixNashidIds() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all nashids without nashidId
    console.log('🔍 Finding nashids without nashidId field...');
    const nashidsWithoutId = await Nashid.find({
      $or: [
        { nashidId: { $exists: false } },
        { nashidId: null }
      ]
    });

    console.log(`Found ${nashidsWithoutId.length} nashids without nashidId\n`);

    if (nashidsWithoutId.length === 0) {
      console.log('✅ All nashids already have nashidId. No migration needed!');
      return;
    }

    // Find the highest existing nashidId
    const highestNashid = await Nashid.findOne({ nashidId: { $exists: true } })
      .sort({ nashidId: -1 })
      .limit(1);

    let nextNashidId = highestNashid ? highestNashid.nashidId + 1 : 1;
    console.log(`Starting nashidId from: ${nextNashidId}\n`);

    // Update each nashid
    console.log('🔧 Updating nashids...');
    for (const nashid of nashidsWithoutId) {
      nashid.nashidId = nextNashidId;
      await nashid.save();
      console.log(`  ✅ Updated "${nashid.title}" - assigned nashidId: ${nextNashidId}`);
      nextNashidId++;
    }

    console.log(`\n✅ Successfully updated ${nashidsWithoutId.length} nashids!`);

    // Verify the fix
    console.log('\n🔍 Verifying...');
    const stillMissing = await Nashid.find({
      $or: [
        { nashidId: { $exists: false } },
        { nashidId: null }
      ]
    });

    if (stillMissing.length === 0) {
      console.log('✅ Verification passed! All nashids now have nashidId');
    } else {
      console.warn(`⚠️ WARNING: ${stillMissing.length} nashids still missing nashidId!`);
    }

  } catch (error) {
    console.error('❌ Error fixing nashid IDs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixNashidIds();
