const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

// GET /api/books - Get all books (for users)
router.get('/', async (req, res) => {
  try {
    const { category, genre, language, search, isPro } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (genre) filter.genre = genre;
    if (language) filter.language = language;
    if (isPro !== undefined) filter.isPro = isPro === 'true';

    if (search) {
      filter.$text = { $search: search };
    }

    const books = await Book.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { publishedDate: -1 })
      .select('title author description cover content category genre language isPro rating reactions publishedDate isNew textExtracted');

    res.json({
      success: true,
      books,
      count: books.length
    });
  } catch (error) {
    console.error('❌ Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message
    });
  }
});

// GET /api/books/:id - Get single book with full text
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      book
    });
  } catch (error) {
    console.error('❌ Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message
    });
  }
});

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

// POST /api/books/:id/extract-text - Extract text from PDF
router.post('/:id/extract-text', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📖 Extracting text from PDF for book:', id);

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.textExtracted) {
      return res.json({
        success: true,
        message: 'Text already extracted',
        text: book.extractedText,
        length: book.extractedText.length
      });
    }

    // Получаем путь к PDF файлу
    const pdfUrl = book.content;
    let pdfPath;

    console.log('📄 Original PDF URL:', pdfUrl);

    // Проверяем если это URL с нашего backend
    if (pdfUrl.startsWith('http')) {
      // Извлекаем относительный путь
      const urlObj = new URL(pdfUrl);
      const relativePath = urlObj.pathname; // Получаем путь без домена
      pdfPath = path.join(__dirname, '..', relativePath.replace(/^\//, ''));
      console.log('🌐 Extracted path from URL:', relativePath);
    } else {
      // Локальный файл
      pdfPath = path.join(__dirname, '..', pdfUrl.replace(/^\//, ''));
    }

    console.log('📄 Reading PDF from:', pdfPath);

    // Читаем файл
    const dataBuffer = await fs.readFile(pdfPath);

    // Извлекаем текст
    console.log('🔍 Parsing PDF...');
    const data = await pdf(dataBuffer);

    const extractedText = data.text;
    console.log('✅ Text extracted:', {
      pages: data.numpages,
      length: extractedText.length,
      preview: extractedText.substring(0, 100)
    });

    // Сохраняем текст в базу данных
    book.extractedText = extractedText;
    book.textExtracted = true;
    await book.save();

    res.json({
      success: true,
      message: 'Text extracted successfully',
      text: extractedText,
      length: extractedText.length,
      pages: data.numpages
    });

  } catch (error) {
    console.error('❌ Extract text error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract text',
      error: error.message
    });
  }
});

module.exports = router;
