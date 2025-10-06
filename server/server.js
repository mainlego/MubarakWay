const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/nashids', nashidsRoutes);
app.use('/api/admin', adminRoutes);

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
    // Initialize Telegram Bot BEFORE starting server (для webhook setup)
    const { startBot } = require('./bot.js');
    await startBot(app);
    console.log('🤖 Telegram Bot initialized\n');

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

    // Start server after bot is initialized
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
