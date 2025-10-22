import { createSlice } from '@reduxjs/toolkit';

// Уровни подписки
export const SUBSCRIPTION_TIERS = {
  BASIC: 'muslim',        // Муслим (Basic)
  PRO: 'mutahsin',        // Мутахсин (PRO)
  PREMIUM: 'sahib_waqf'   // Сахиб аль-Вакф (Premium)
};

// Конфигурация подписок
export const SUBSCRIPTION_CONFIG = {
  [SUBSCRIPTION_TIERS.BASIC]: {
    id: SUBSCRIPTION_TIERS.BASIC,
    name: 'Муслим',
    nameEn: 'Muslim',
    description: 'Библиотека для знакомства',
    price: 0,
    features: {
      books: {
        access: 0.4, // 40% от каталога
        offlineLimit: 2, // книг в месяц
        favoritesLimit: 2 // макс. избранных
      },
      nashids: {
        count: 50, // базовая коллекция
        offlineLimit: 5, // нашидов в месяц
        favoritesLimit: 5,
        perCategory: 5 // макс. на категорию
      },
      search: {
        basic: true, // только по названию и автору
        advanced: false
      },
      features: {
        notes: false,
        sync: false,
        backgroundAudio: false,
        export: false,
        aiAssistant: false,
        familyAccess: 0,
        earlyAccess: false,
        exclusiveContent: false
      }
    },
    color: 'gray'
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    id: SUBSCRIPTION_TIERS.PRO,
    name: 'Мутахсин',
    nameEn: 'Mutahsin',
    description: 'Библиотека для роста',
    price: 299, // руб/месяц
    features: {
      books: {
        access: 1.0, // 100% каталога
        offlineLimit: -1, // безлимит
        favoritesLimit: -1 // безлимит
      },
      nashids: {
        count: -1, // полная коллекция
        offlineLimit: -1, // безлимит
        favoritesLimit: -1,
        perCategory: -1
      },
      search: {
        basic: true,
        advanced: true, // поиск по тексту и тегам
        textSearch: true
      },
      features: {
        notes: true, // заметки и цитаты
        sync: true, // синхронизация
        backgroundAudio: true, // фоновое воспроизведение
        export: false,
        aiAssistant: false,
        familyAccess: 0,
        earlyAccess: false,
        exclusiveContent: false
      }
    },
    color: 'blue'
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    id: SUBSCRIPTION_TIERS.PREMIUM,
    name: 'Сахиб аль-Вакф',
    nameEn: 'Sahib al-Waqf',
    description: 'Библиотека для лидера',
    price: 599, // руб/месяц
    features: {
      books: {
        access: 1.0,
        offlineLimit: -1,
        favoritesLimit: -1
      },
      nashids: {
        count: -1,
        offlineLimit: -1,
        favoritesLimit: -1,
        perCategory: -1
      },
      search: {
        basic: true,
        advanced: true,
        textSearch: true,
        semantic: true // AI-поиск по смыслу
      },
      features: {
        notes: true,
        sync: true,
        backgroundAudio: true,
        export: true, // экспорт в PDF
        aiAssistant: true, // AI рекомендации и анализ
        familyAccess: 3, // до 3 профилей
        earlyAccess: true, // ранний доступ (1-4 недели)
        exclusiveContent: true, // эксклюзивные нашиды и книги
        badge: 'Меценат знаний' // значок в профиле
      }
    },
    color: 'amber'
  }
};

const initialState = {
  currentTier: SUBSCRIPTION_TIERS.BASIC,
  expiresAt: null,
  isActive: true,

  // Статистика использования
  usage: {
    booksOffline: 0,
    booksFavorites: 0,
    nashidsOffline: 0,
    nashidsFavorites: 0,
    resetDate: new Date().toISOString()
  },

  // История подписок
  history: [],

  // Пробный период
  trial: {
    used: false,
    tier: null,
    expiresAt: null
  }
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (state, action) => {
      const { tier, expiresAt } = action.payload;
      state.currentTier = tier;
      state.expiresAt = expiresAt;
      state.isActive = true;

      state.history.push({
        tier,
        startedAt: new Date().toISOString(),
        expiresAt
      });
    },

    cancelSubscription: (state) => {
      state.isActive = false;
    },

    // Увеличение счетчиков использования
    incrementOfflineBooks: (state) => {
      state.usage.booksOffline += 1;
    },

    incrementFavoriteBooks: (state) => {
      state.usage.booksFavorites += 1;
    },

    decrementFavoriteBooks: (state) => {
      if (state.usage.booksFavorites > 0) {
        state.usage.booksFavorites -= 1;
      }
    },

    incrementOfflineNashids: (state) => {
      state.usage.nashidsOffline += 1;
    },

    incrementFavoriteNashids: (state) => {
      state.usage.nashidsFavorites += 1;
    },

    decrementFavoriteNashids: (state) => {
      if (state.usage.nashidsFavorites > 0) {
        state.usage.nashidsFavorites -= 1;
      }
    },

    // Сброс месячных лимитов
    resetMonthlyLimits: (state) => {
      state.usage.booksOffline = 0;
      state.usage.nashidsOffline = 0;
      state.usage.resetDate = new Date().toISOString();
    },

    // Пробный период
    activateTrial: (state, action) => {
      const { tier, days } = action.payload;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      state.trial.used = true;
      state.trial.tier = tier;
      state.trial.expiresAt = expiresAt.toISOString();

      state.currentTier = tier;
      state.expiresAt = expiresAt.toISOString();
      state.isActive = true;
    }
  }
});

export const {
  setSubscription,
  cancelSubscription,
  incrementOfflineBooks,
  incrementFavoriteBooks,
  decrementFavoriteBooks,
  incrementOfflineNashids,
  incrementFavoriteNashids,
  decrementFavoriteNashids,
  resetMonthlyLimits,
  activateTrial
} = subscriptionSlice.actions;

// Селекторы
export const selectCurrentSubscription = (state) => {
  const tier = state.subscription.currentTier;
  return SUBSCRIPTION_CONFIG[tier];
};

export const selectCanAddOfflineBook = (state) => {
  const config = selectCurrentSubscription(state);
  const { booksOffline } = state.subscription.usage;

  if (config.features.books.offlineLimit === -1) return true; // безлимит
  return booksOffline < config.features.books.offlineLimit;
};

export const selectCanAddFavoriteBook = (state) => {
  const config = selectCurrentSubscription(state);
  const { booksFavorites } = state.subscription.usage;

  if (config.features.books.favoritesLimit === -1) return true;
  return booksFavorites < config.features.books.favoritesLimit;
};

export const selectCanAddOfflineNashid = (state) => {
  const config = selectCurrentSubscription(state);
  const { nashidsOffline } = state.subscription.usage;

  if (config.features.nashids.offlineLimit === -1) return true;
  return nashidsOffline < config.features.nashids.offlineLimit;
};

export const selectCanAddFavoriteNashid = (state) => {
  const config = selectCurrentSubscription(state);
  const { nashidsFavorites } = state.subscription.usage;

  if (config.features.nashids.favoritesLimit === -1) return true;
  return nashidsFavorites < config.features.nashids.favoritesLimit;
};

export const selectHasFeature = (featureName) => (state) => {
  const config = selectCurrentSubscription(state);
  return config.features.features[featureName] || false;
};

// Селекторы для отображения оставшихся лимитов
export const selectRemainingOfflineBooks = (state) => {
  const config = selectCurrentSubscription(state);
  const { booksOffline } = state.subscription.usage;

  if (config.features.books.offlineLimit === -1) return -1; // безлимит
  return config.features.books.offlineLimit - booksOffline;
};

export const selectRemainingFavoriteBooks = (state) => {
  const config = selectCurrentSubscription(state);
  const { booksFavorites } = state.subscription.usage;

  if (config.features.books.favoritesLimit === -1) return -1;
  return config.features.books.favoritesLimit - booksFavorites;
};

export const selectRemainingOfflineNashids = (state) => {
  const config = selectCurrentSubscription(state);
  const { nashidsOffline } = state.subscription.usage;

  if (config.features.nashids.offlineLimit === -1) return -1;
  return config.features.nashids.offlineLimit - nashidsOffline;
};

export const selectRemainingFavoriteNashids = (state) => {
  const config = selectCurrentSubscription(state);
  const { nashidsFavorites } = state.subscription.usage;

  if (config.features.nashids.favoritesLimit === -1) return -1;
  return config.features.nashids.favoritesLimit - nashidsFavorites;
};

export default subscriptionSlice.reducer;
