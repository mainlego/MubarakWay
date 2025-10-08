import axios from 'axios';

// API Base URL - автоматически определяется
let API_BASE_URL = import.meta.env.VITE_API_URL;

// Если переменная не установлена, используем defaults
if (!API_BASE_URL) {
  API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://mubarakway-backend.onrender.com/api';
} else {
  // Убеждаемся что URL заканчивается на /api
  if (!API_BASE_URL.endsWith('/api')) {
    API_BASE_URL = API_BASE_URL + '/api';
  }
}

console.log('[API] Base URL configured:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth API
export const authAPI = {
  // Автоматический вход/регистрация через Telegram
  login: async (telegramUser) => {
    try {
      const url = `${API_BASE_URL}/auth/login`;
      console.log('[API] Making POST request to:', url);

      const response = await api.post('/auth/login', {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code
      });

      console.log('[API] Response status:', response.status);
      console.log('[API] Response data type:', typeof response.data);
      console.log('[API] Response data:', response.data);

      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  // Получить данные пользователя
  getUser: async (telegramId) => {
    try {
      const response = await api.get(`/auth/user/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('Get user API error:', error);
      throw error;
    }
  },

  // Завершить онбординг
  completeOnboarding: async (telegramId) => {
    try {
      const response = await api.put(`/auth/onboarding/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('Complete onboarding API error:', error);
      throw error;
    }
  },

  // Сохранить геолокацию пользователя
  saveLocation: async (telegramId, latitude, longitude, city = null, country = null) => {
    try {
      const response = await api.put(`/auth/location/${telegramId}`, {
        latitude,
        longitude,
        city,
        country
      });
      return response.data;
    } catch (error) {
      console.error('Save location API error:', error);
      throw error;
    }
  },

  // Получить настройки уведомлений
  getNotifications: async (telegramId) => {
    try {
      const response = await api.get(`/auth/notifications/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('Get notifications API error:', error);
      throw error;
    }
  },

  // Сохранить настройки уведомлений
  saveNotifications: async (telegramId, notifications) => {
    try {
      const response = await api.put(`/auth/notifications/${telegramId}`, {
        notifications
      });
      return response.data;
    } catch (error) {
      console.error('Save notifications API error:', error);
      throw error;
    }
  }
};

// Books API
export const booksAPI = {
  // Toggle favorite book
  toggleFavorite: async (telegramId, bookId) => {
    try {
      const response = await api.post('/books/favorite', {
        telegramId,
        bookId
      });
      return response.data;
    } catch (error) {
      console.error('Toggle favorite book error:', error);
      throw error;
    }
  },

  // Toggle offline book
  toggleOffline: async (telegramId, bookId) => {
    try {
      const response = await api.post('/books/offline', {
        telegramId,
        bookId
      });
      return response.data;
    } catch (error) {
      console.error('Toggle offline book error:', error);
      throw error;
    }
  },

  // Update reading progress
  updateProgress: async (telegramId, bookId, progress) => {
    try {
      const response = await api.post('/books/progress', {
        telegramId,
        bookId,
        progress
      });
      return response.data;
    } catch (error) {
      console.error('Update progress error:', error);
      throw error;
    }
  },

  // Get favorites
  getFavorites: async (telegramId) => {
    try {
      const response = await api.get(`/books/favorites/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  }
};

// Nashids API
export const nashidsAPI = {
  // Toggle favorite nashid
  toggleFavorite: async (telegramId, nashidId) => {
    try {
      const response = await api.post('/nashids/favorite', {
        telegramId,
        nashidId
      });
      return response.data;
    } catch (error) {
      console.error('Toggle favorite nashid error:', error);
      throw error;
    }
  },

  // Toggle offline nashid
  toggleOffline: async (telegramId, nashidId) => {
    try {
      const response = await api.post('/nashids/offline', {
        telegramId,
        nashidId
      });
      return response.data;
    } catch (error) {
      console.error('Toggle offline nashid error:', error);
      throw error;
    }
  },

  // Get favorites
  getFavorites: async (telegramId) => {
    try {
      const response = await api.get(`/nashids/favorites/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  },

  // Create playlist
  createPlaylist: async (telegramId, name, nashids) => {
    try {
      const response = await api.post('/nashids/playlist', {
        telegramId,
        name,
        nashids
      });
      return response.data;
    } catch (error) {
      console.error('Create playlist error:', error);
      throw error;
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    return { success: false, error: error.message };
  }
};

export default api;
