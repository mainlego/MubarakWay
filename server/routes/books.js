const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/books/favorite - Add/Remove book from favorites
router.post('/favorite', async (req, res) => {
  try {
    const { telegramId, bookId } = req.body;

    if (!telegramId || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID and Book ID are required'
      });
    }

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle favorite
    const index = user.favorites.books.indexOf(bookId);
    if (index > -1) {
      user.favorites.books.splice(index, 1);
    } else {
      user.favorites.books.push(bookId);
    }

    await user.save();

    console.log(`📚 Book ${bookId} favorite toggled for user ${telegramId}`);

    res.json({
      success: true,
      favorites: user.favorites.books
    });

  } catch (error) {
    console.error('❌ Favorite book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/books/offline - Add/Remove book from offline
router.post('/offline', async (req, res) => {
  try {
    const { telegramId, bookId } = req.body;

    if (!telegramId || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID and Book ID are required'
      });
    }

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle offline
    const index = user.offline.books.indexOf(bookId);
    if (index > -1) {
      user.offline.books.splice(index, 1);
      user.usage.booksOffline = Math.max(0, user.usage.booksOffline - 1);
    } else {
      user.offline.books.push(bookId);
      user.usage.booksOffline += 1;
    }

    await user.save();

    console.log(`💾 Book ${bookId} offline toggled for user ${telegramId}`);

    res.json({
      success: true,
      offline: user.offline.books,
      usage: user.usage
    });

  } catch (error) {
    console.error('❌ Offline book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/books/progress - Update reading progress
router.post('/progress', async (req, res) => {
  try {
    const { telegramId, bookId, progress } = req.body;

    if (!telegramId || !bookId || progress === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID, Book ID and progress are required'
      });
    }

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update or create progress entry
    const existingIndex = user.readingProgress.findIndex(p => p.bookId === bookId);

    if (existingIndex > -1) {
      user.readingProgress[existingIndex].progress = progress;
      user.readingProgress[existingIndex].lastRead = new Date();
    } else {
      user.readingProgress.push({
        bookId,
        progress,
        lastRead: new Date()
      });
    }

    await user.save();

    console.log(`📖 Reading progress updated for book ${bookId}, user ${telegramId}: ${progress}%`);

    res.json({
      success: true,
      readingProgress: user.readingProgress
    });

  } catch (error) {
    console.error('❌ Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/books/favorites/:telegramId - Get user's favorite books
router.get('/favorites/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      favorites: user.favorites.books
    });

  } catch (error) {
    console.error('❌ Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
