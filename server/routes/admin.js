const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Book = require('../models/Book');
const Nashid = require('../models/Nashid');
const User = require('../models/User');

const router = express.Router();

// JWT Secret (в production должно быть в .env)
const JWT_SECRET = process.env.JWT_SECRET || 'mubarakway-admin-secret-2025';

// Middleware для проверки токена админа
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or admin inactive' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// ============ AUTHENTICATION ============

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Verify token
router.get('/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      role: req.admin.role,
      permissions: req.admin.permissions
    }
  });
});

// ============ DASHBOARD STATS ============

router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalBooks,
      totalNashids,
      totalUsers,
      activeUsers,
      premiumUsers
    ] = await Promise.all([
      Book.countDocuments(),
      Nashid.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ 'subscription.tier': { $in: ['mutahsin', 'sahib'] } })
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName telegramId createdAt subscription');

    res.json({
      success: true,
      stats: {
        totalBooks,
        totalNashids,
        totalUsers,
        activeUsers,
        premiumUsers,
        recentUsers
      }
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

// ============ BOOKS MANAGEMENT ============

// Get all books with filters
router.get('/books', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, language } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (language) filter.language = language;

    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Book.countDocuments(filter);

    res.json({
      success: true,
      books,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
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

// Get single book
router.get('/books/:id', authenticateAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({ success: true, book });
  } catch (error) {
    console.error('❌ Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message
    });
  }
});

// Create book
router.post('/books', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageBooks) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage books'
      });
    }

    const bookData = req.body;
    const book = new Book(bookData);
    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book
    });
  } catch (error) {
    console.error('❌ Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message
    });
  }
});

// Update book
router.put('/books/:id', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageBooks) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage books'
      });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    console.error('❌ Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message
    });
  }
});

// Delete book
router.delete('/books/:id', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageBooks) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage books'
      });
    }

    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message
    });
  }
});

// ============ NASHIDS MANAGEMENT ============

// Get all nashids with filters
router.get('/nashids', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;

    const nashids = await Nashid.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Nashid.countDocuments(filter);

    res.json({
      success: true,
      nashids,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('❌ Get nashids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nashids',
      error: error.message
    });
  }
});

// Create nashid
router.post('/nashids', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageNashids) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage nashids'
      });
    }

    const nashidData = req.body;
    const nashid = new Nashid(nashidData);
    await nashid.save();

    res.status(201).json({
      success: true,
      message: 'Nashid created successfully',
      nashid
    });
  } catch (error) {
    console.error('❌ Create nashid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create nashid',
      error: error.message
    });
  }
});

// Update nashid
router.put('/nashids/:id', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageNashids) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage nashids'
      });
    }

    const nashid = await Nashid.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!nashid) {
      return res.status(404).json({
        success: false,
        message: 'Nashid not found'
      });
    }

    res.json({
      success: true,
      message: 'Nashid updated successfully',
      nashid
    });
  } catch (error) {
    console.error('❌ Update nashid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update nashid',
      error: error.message
    });
  }
});

// Delete nashid
router.delete('/nashids/:id', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageNashids) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage nashids'
      });
    }

    const nashid = await Nashid.findByIdAndDelete(req.params.id);

    if (!nashid) {
      return res.status(404).json({
        success: false,
        message: 'Nashid not found'
      });
    }

    res.json({
      success: true,
      message: 'Nashid deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete nashid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete nashid',
      error: error.message
    });
  }
});

// ============ USERS MANAGEMENT ============

router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageUsers) {
      return res.status(403).json({
        success: false,
        message: 'No permission to view users'
      });
    }

    const { page = 1, limit = 50, search, tier } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { telegramId: { $regex: search, $options: 'i' } }
      ];
    }
    if (tier) filter['subscription.tier'] = tier;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const count = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Update user subscription
router.patch('/users/:id/subscription', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageUsers) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage users'
      });
    }

    const { tier, expiresAt } = req.body;

    // Validate tier
    const validTiers = ['muslim', 'mutahsin', 'sahib'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription tier'
      });
    }

    // Build update object
    const updateData = {
      'subscription.tier': tier,
      'subscription.isActive': true
    };

    // Set expiration for paid tiers
    if (tier === 'mutahsin' || tier === 'sahib') {
      if (expiresAt) {
        updateData['subscription.expiresAt'] = new Date(expiresAt);
      } else {
        // Default: 30 days from now
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        updateData['subscription.expiresAt'] = defaultExpiry;
      }
      updateData['subscription.startedAt'] = new Date();
    } else {
      // Free tier - no expiration
      updateData['subscription.expiresAt'] = null;
      updateData['subscription.startedAt'] = null;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      user
    });
  } catch (error) {
    console.error('❌ Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
});

module.exports = router;
