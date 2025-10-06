const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Telegram данные
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    default: null
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  languageCode: {
    type: String,
    default: 'ru'
  },

  // Подписка
  subscription: {
    tier: {
      type: String,
      enum: ['muslim', 'mutahsin', 'sahib_waqf'],
      default: 'muslim'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    startedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Использование лимитов (сбрасывается каждый месяц)
  usage: {
    booksOffline: {
      type: Number,
      default: 0
    },
    booksFavorites: {
      type: Number,
      default: 0
    },
    nashidsOffline: {
      type: Number,
      default: 0
    },
    nashidsFavorites: {
      type: Number,
      default: 0
    },
    resetDate: {
      type: Date,
      default: Date.now
    }
  },

  // Избранное (хранятся ID из mock data, не ObjectId)
  favorites: {
    books: [{
      type: Number
    }],
    nashids: [{
      type: Number
    }]
  },

  // Офлайн контент (хранятся ID из mock data, не ObjectId)
  offline: {
    books: [{
      type: Number
    }],
    nashids: [{
      type: Number
    }]
  },

  // Настройки молитв
  prayerSettings: {
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    },
    calculationMethod: {
      type: String,
      default: 'MuslimWorldLeague'
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: true
      },
      vibration: {
        type: Boolean,
        default: true
      },
      // Уведомление за N минут до молитвы
      reminderBefore: {
        type: Number,
        default: 10,
        enum: [0, 5, 10, 15, 30]
      },
      // Уведомление в момент наступления времени
      atPrayerTime: {
        type: Boolean,
        default: true
      },
      // Отдельные настройки для каждой молитвы
      prayers: {
        fajr: {
          type: Boolean,
          default: true
        },
        dhuhr: {
          type: Boolean,
          default: true
        },
        asr: {
          type: Boolean,
          default: true
        },
        maghrib: {
          type: Boolean,
          default: true
        },
        isha: {
          type: Boolean,
          default: true
        }
      },
      // Тип уведомления (только в Telegram или везде)
      telegramOnly: {
        type: Boolean,
        default: false
      }
    }
  },

  // Прогресс чтения
  readingProgress: {
    type: Map,
    of: Number,
    default: {}
  },

  // История подписок
  subscriptionHistory: [{
    tier: String,
    startedAt: Date,
    expiresAt: Date,
    cancelledAt: Date
  }],

  // Метаданные
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
userSchema.index({ telegramId: 1 });
userSchema.index({ 'subscription.tier': 1 });
userSchema.index({ createdAt: -1 });

// Метод для проверки и сброса месячных лимитов
userSchema.methods.checkAndResetMonthlyLimits = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.resetDate);

  // Проверяем, прошел ли месяц
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.booksOffline = 0;
    this.usage.nashidsOffline = 0;
    this.usage.resetDate = now;
    return true;
  }
  return false;
};

// Метод для проверки активности подписки
userSchema.methods.checkSubscriptionStatus = function() {
  if (!this.subscription.expiresAt) {
    return this.subscription.isActive;
  }

  const now = new Date();
  if (now > this.subscription.expiresAt) {
    this.subscription.isActive = false;
    this.subscription.tier = 'muslim'; // Вернуть к базовому тарифу
    return false;
  }

  return this.subscription.isActive;
};

// Обновление времени последней активности
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
