const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Book = require('../models/Book');
const Nashid = require('../models/Nashid');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

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

// ============ ADMIN PROFILE MANAGEMENT ============

// Update admin profile
router.put('/profile', authenticateAdmin, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validate input
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username and email are required'
      });
    }

    // Check if username/email already taken by another admin
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: req.admin._id }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already taken'
      });
    }

    // Update admin
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Change password
router.put('/password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isPasswordValid = await admin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
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

    console.log('📚 Creating book with data:', JSON.stringify(req.body, null, 2));
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

    console.log('📝 Updating book:', req.params.id);
    console.log('📦 Update data:', req.body);

    // Получаем существующую книгу
    const existingBook = await Book.findById(req.params.id);

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Если PDF файл изменился, сбрасываем извлеченный текст
    let shouldResetText = false;
    if (req.body.content && req.body.content !== existingBook.content) {
      console.log('📄 PDF changed, resetting extracted text');
      shouldResetText = true;
    }

    // Сохраняем extractedText и textExtracted если они не переданы в обновлении
    const updateData = {
      ...req.body,
      extractedText: shouldResetText ? '' : (req.body.extractedText !== undefined ? req.body.extractedText : existingBook.extractedText),
      textExtracted: shouldResetText ? false : (req.body.textExtracted !== undefined ? req.body.textExtracted : existingBook.textExtracted)
    };

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Book updated:', book.title);

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

    const nashidData = {
      ...req.body,
      // Map coverImage to cover for backward compatibility
      cover: req.body.coverImage || req.body.cover
    };

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

    const updateData = {
      ...req.body,
      // Map coverImage to cover for backward compatibility
      cover: req.body.coverImage || req.body.cover
    };

    const nashid = await Nashid.findByIdAndUpdate(
      req.params.id,
      updateData,
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

// ============ ADMINS MANAGEMENT ============

// Get all admins (только для admin role)
router.get('/admins', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageAdmins) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage admins'
      });
    }

    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('❌ Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
      error: error.message
    });
  }
});

// Create new admin (только для admin role)
router.post('/admins', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageAdmins) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage admins'
      });
    }

    const { username, email, password, role, permissions } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
    }

    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      username,
      email,
      password,
      role: role || 'editor',
      permissions: permissions || {
        canManageBooks: true,
        canManageNashids: true,
        canManageUsers: false,
        canViewAnalytics: true,
        canManageAdmins: false
      },
      isActive: true
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    });
  } catch (error) {
    console.error('❌ Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error.message
    });
  }
});

// Update admin (только для admin role)
router.put('/admins/:id', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageAdmins) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage admins'
      });
    }

    const { username, email, role, permissions, isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (req.admin._id.toString() === req.params.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Check if username/email already taken by another admin
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: req.params.id }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already taken'
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin updated successfully',
      admin
    });
  } catch (error) {
    console.error('❌ Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin',
      error: error.message
    });
  }
});

// Delete admin (только для admin role)
router.delete('/admins/:id', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageAdmins) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage admins'
      });
    }

    // Prevent admin from deleting themselves
    if (req.admin._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin',
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

// ============ SUBSCRIPTIONS MANAGEMENT ============

// GET /api/admin/subscriptions - Get all subscription tiers
router.get('/subscriptions', authenticateAdmin, async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ order: 1 });

    res.json({
      success: true,
      subscriptions,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('❌ Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});

// GET /api/admin/subscriptions/:tier - Get specific subscription
router.get('/subscriptions/:tier', authenticateAdmin, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ tier: req.params.tier });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('❌ Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
});

// PUT /api/admin/subscriptions/:tier - Update subscription settings
router.put('/subscriptions/:tier', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageAdmins) {
      return res.status(403).json({
        success: false,
        message: 'No permission to manage subscriptions'
      });
    }

    const updateData = req.body;
    // Prevent tier change
    delete updateData.tier;

    const subscription = await Subscription.findOneAndUpdate(
      { tier: req.params.tier },
      updateData,
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription
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
