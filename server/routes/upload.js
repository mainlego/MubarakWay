const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем директории для загрузок если их нет
const uploadsDir = path.join(__dirname, '../uploads');
const categoriesDir = {
  covers: path.join(uploadsDir, 'covers'),
  books: path.join(uploadsDir, 'books'),
  nashids: path.join(uploadsDir, 'nashids')
};

Object.values(categoriesDir).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Настройка хранилища multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = req.body.category || 'covers';
    const dir = categoriesDir[category] || categoriesDir.covers;
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя: timestamp-random-original.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_');
    cb(null, sanitizedName + '-' + uniqueSuffix + ext);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const category = req.body.category || 'covers';

  if (category === 'covers') {
    // Для обложек только изображения
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены для обложек'), false);
    }
  } else if (category === 'books') {
    // Для книг только PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Только PDF файлы разрешены для книг'), false);
    }
  } else if (category === 'nashids') {
    // Для нашидов только аудио
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Только аудио файлы разрешены для нашидов'), false);
    }
  } else {
    cb(new Error('Неизвестная категория файла'), false);
  }
};

// Настройка multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB максимум
  }
});

// Middleware для проверки авторизации админа
const authenticateAdmin = (req, res, next) => {
  console.log('🔐 Upload auth check - Headers:', req.headers.authorization?.substring(0, 50));
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.error('❌ Upload: No token provided');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'mubarakway-secret-key-2025';
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Upload: Token valid for admin:', decoded.username);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('❌ Upload: Invalid token -', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// POST /api/upload - Загрузка файла
router.post('/', authenticateAdmin, upload.single('file'), async (req, res) => {
  console.log('📤 Upload request received');
  console.log('📁 Category:', req.body.category);
  console.log('📄 File:', req.file?.filename);

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Формируем URL для доступа к файлу
    const category = req.body.category || 'covers';
    const fileUrl = `/uploads/${category}/${req.file.filename}`;

    console.log(`✅ File uploaded: ${fileUrl}`);

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
});

// DELETE /api/upload - Удаление файла
router.delete('/', authenticateAdmin, async (req, res) => {
  console.log('🗑️ Delete file request');
  console.log('📄 File URL:', req.body.fileUrl);

  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    // Извлекаем путь к файлу из URL
    // fileUrl: /uploads/covers/filename.jpg
    const filePath = path.join(__dirname, '..', fileUrl);

    // Проверяем что файл существует
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Удаляем файл
    fs.unlinkSync(filePath);

    console.log(`✅ File deleted: ${fileUrl}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file deletion',
      error: error.message
    });
  }
});

module.exports = router;
