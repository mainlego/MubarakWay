const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required for Render.com and rate limiting to work correctly
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://mubarakway-frontend.onrender.com',
      'https://mubarak-way.onrender.com',
    ];

    // Allow Telegram domains (web.telegram.org, etc.)
    if (!origin ||
        allowedOrigins.includes(origin) ||
        origin.includes('telegram.org') ||
        origin.includes('t.me')) {
      callback(null, true);
    } else {
      console.log('⛔ CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Security Middleware - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["'self'", "https://*.telegram.org", "https://telegram.org"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://*.telegram.org", "https://mubarakway-frontend.onrender.com", "https://mubarak-way.onrender.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting - General API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiting - Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Middleware
app.use(cors(corsOptions));

// Additional CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://mubarakway-frontend.onrender.com',
      'https://mubarak-way.onrender.com',
    ];

    if (allowed.includes(origin) ||
        origin.includes('telegram.org') ||
        origin.includes('t.me')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight from:', origin);
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Статические файлы для загрузок
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Логирование запросов (кроме health checks)
app.use((req, res, next) => {
  // Пропускаем логирование health checks от Render
  if (req.path === '/api/health') {
    return next();
  }

  if (req.path === '/webhook') {
    console.log(`📨 ${req.method} ${req.path}`);
    console.log('📦 Body:', JSON.stringify(req.body).substring(0, 200));
  } else {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Подключение к MongoDB
connectDB();

// Routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const nashidsRoutes = require('./routes/nashids');
const subscriptionsRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

// Apply rate limiting to routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/books', limiter, booksRoutes);
app.use('/api/nashids', limiter, nashidsRoutes);
app.use('/api/subscriptions', limiter, subscriptionsRoutes);
app.use('/api/admin', limiter, adminRoutes);
app.use('/api/upload', limiter, uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize bot and start server
const startServer = async () => {
  try {
    // Try to initialize Telegram Bot (optional)
    try {
      const { startBot } = require('./bot.js');
      await startBot(app);
      console.log('🤖 Telegram Bot initialized\n');
    } catch (botError) {
      console.warn('⚠️  Telegram Bot not initialized (token missing or error)');
      console.warn('📡 API server will continue without bot functionality\n');
    }

    // ВАЖНО: 404 и Error handlers добавляем ПОСЛЕ webhook route
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});
