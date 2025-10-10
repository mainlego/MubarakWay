const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Название тарифа (уникальный ID подписки)
  tier: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9_]+$/ // Только lowercase буквы, цифры и подчеркивания
  },

  // Отображаемое название
  name: {
    type: String,
    required: true
  },

  // Описание тарифа
  description: {
    type: String,
    default: ''
  },

  // Цена (для справки)
  price: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'RUB'
    },
    period: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      default: 'monthly'
    }
  },

  // Лимиты на книги
  limits: {
    booksOffline: {
      type: Number,
      default: 0,
      min: 0
    },
    booksFavorites: {
      type: Number,
      default: 0,
      min: 0
    },
    nashidsOffline: {
      type: Number,
      default: 0,
      min: 0
    },
    nashidsFavorites: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Доступ к контенту
  access: {
    freeContent: {
      type: Boolean,
      default: true
    },
    proContent: {
      type: Boolean,
      default: false
    },
    premiumContent: {
      type: Boolean,
      default: false
    }
  },

  // Дополнительные возможности
  features: {
    offlineMode: {
      type: Boolean,
      default: false
    },
    adFree: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    earlyAccess: {
      type: Boolean,
      default: false
    }
  },

  // Активность
  isActive: {
    type: Boolean,
    default: true
  },

  // Порядок отображения
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Индексы
subscriptionSchema.index({ tier: 1 });
subscriptionSchema.index({ isActive: 1 });
subscriptionSchema.index({ order: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
