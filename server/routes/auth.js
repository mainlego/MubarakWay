const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/login - Автоматическая регистрация/вход через Telegram
router.post('/login', async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName, languageCode } = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID is required'
      });
    }

    // Ищем пользователя по Telegram ID
    let user = await User.findOne({ telegramId });

    if (user) {
      // Обновляем информацию при входе
      user.username = username || user.username;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.languageCode = languageCode || user.languageCode;

      // Проверяем и сбрасываем месячные лимиты
      const limitsReset = user.checkAndResetMonthlyLimits();

      // Проверяем статус подписки
      user.checkSubscriptionStatus();

      // Обновляем время последней активности
      await user.updateLastActive();

      console.log(`✅ User logged in: ${telegramId} (${firstName})`);
      if (limitsReset) {
        console.log(`🔄 Monthly limits reset for user: ${telegramId}`);
      }
    } else {
      // Создаем нового пользователя
      user = new User({
        telegramId,
        username,
        firstName,
        lastName,
        languageCode: languageCode || 'ru',
        subscription: {
          tier: 'muslim',
          isActive: true,
          expiresAt: null,
          startedAt: new Date()
        },
        usage: {
          booksOffline: 0,
          booksFavorites: 0,
          nashidsOffline: 0,
          nashidsFavorites: 0,
          resetDate: new Date()
        }
      });

      await user.save();
      console.log(`🆕 New user registered: ${telegramId} (${firstName})`);
    }

    // Возвращаем данные пользователя
    res.json({
      success: true,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription,
        usage: user.usage,
        favorites: user.favorites,
        offline: user.offline,
        prayerSettings: user.prayerSettings,
        readingProgress: user.readingProgress,
        onboardingCompleted: user.onboardingCompleted
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// GET /api/auth/user/:telegramId - Получить данные пользователя
router.get('/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Проверяем статус подписки
    user.checkSubscriptionStatus();
    await user.updateLastActive();

    res.json({
      success: true,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription,
        usage: user.usage,
        favorites: user.favorites,
        offline: user.offline,
        prayerSettings: user.prayerSettings,
        readingProgress: user.readingProgress,
        onboardingCompleted: user.onboardingCompleted
      }
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/auth/onboarding/:telegramId - Отметить завершение онбординга
router.put('/onboarding/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.onboardingCompleted = true;
    await user.save();

    res.json({
      success: true,
      message: 'Onboarding completed'
    });

  } catch (error) {
    console.error('❌ Onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
