import axios from 'axios';

// API Base URL - в продакшене будет другой URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
      const response = await api.post('/auth/login', {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code
      });
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
