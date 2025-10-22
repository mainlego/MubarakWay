import Dexie from 'dexie';

// Database schema
class MubarakWayDB extends Dexie {
  constructor() {
    super('MubarakWayDB');

    this.version(1).stores({
      books: '++id, title, author, content, description, cover, category, isPro, downloadedAt, lastRead',
      nashids: '++id, title, artist, audioUrl, duration, category, downloadedAt, lastPlayed',
      readingProgress: '++id, bookId, progress, currentPage, lastPosition, updatedAt',
      prayerTimes: '++id, date, location, times, calculationMethod, updatedAt',
      userSettings: '++id, setting, value, updatedAt',
      offlineContent: '++id, type, content, metadata, downloadedAt, expiresAt'
    });
  }
}

const db = new MubarakWayDB();

// Books offline storage
export const offlineBooks = {
  // Сохранить книгу для офлайн чтения
  async saveBook(book) {
    try {
      const offlineBook = {
        ...book,
        downloadedAt: new Date(),
        lastRead: new Date()
      };
      await db.books.put(offlineBook);
      return true;
    } catch (error) {
      console.error('Error saving book offline:', error);
      return false;
    }
  },

  // Получить все офлайн книги
  async getAllBooks() {
    try {
      return await db.books.orderBy('lastRead').reverse().toArray();
    } catch (error) {
      console.error('Error getting offline books:', error);
      return [];
    }
  },

  // Получить конкретную книгу
  async getBook(id) {
    try {
      return await db.books.get(id);
    } catch (error) {
      console.error('Error getting offline book:', error);
      return null;
    }
  },

  // Удалить книгу из офлайн хранилища
  async removeBook(id) {
    try {
      await db.books.delete(id);
      return true;
    } catch (error) {
      console.error('Error removing offline book:', error);
      return false;
    }
  },

  // Проверить, есть ли книга в офлайн хранилище
  async isBookOffline(id) {
    try {
      const book = await db.books.get(id);
      return !!book;
    } catch (error) {
      return false;
    }
  },

  // Обновить время последнего чтения
  async updateLastRead(id) {
    try {
      await db.books.update(id, { lastRead: new Date() });
    } catch (error) {
      console.error('Error updating last read:', error);
    }
  }
};

// Nashids offline storage
export const offlineNashids = {
  // Сохранить нашид для офлайн прослушивания
  async saveNashid(nashid, audioBlob) {
    try {
      const offlineNashid = {
        ...nashid,
        audioBlob: audioBlob, // Сохраняем аудио как blob
        downloadedAt: new Date(),
        lastPlayed: new Date()
      };
      await db.nashids.put(offlineNashid);
      return true;
    } catch (error) {
      console.error('Error saving nashid offline:', error);
      return false;
    }
  },

  // Получить все офлайн нашиды
  async getAllNashids() {
    try {
      return await db.nashids.orderBy('lastPlayed').reverse().toArray();
    } catch (error) {
      console.error('Error getting offline nashids:', error);
      return [];
    }
  },

  // Получить конкретный нашид
  async getNashid(id) {
    try {
      return await db.nashids.get(id);
    } catch (error) {
      console.error('Error getting offline nashid:', error);
      return null;
    }
  },

  // Удалить нашид из офлайн хранилища
  async removeNashid(id) {
    try {
      await db.nashids.delete(id);
      return true;
    } catch (error) {
      console.error('Error removing offline nashid:', error);
      return false;
    }
  },

  // Проверить, есть ли нашид в офлайн хранилище
  async isNashidOffline(id) {
    try {
      const nashid = await db.nashids.get(id);
      return !!nashid;
    } catch (error) {
      return false;
    }
  }
};

// Reading progress storage
export const readingProgress = {
  // Сохранить прогресс чтения
  async saveProgress(bookId, progress, currentPage = 1, lastPosition = 0) {
    try {
      const progressData = {
        bookId,
        progress,
        currentPage,
        lastPosition,
        updatedAt: new Date()
      };
      await db.readingProgress.put(progressData);
      return true;
    } catch (error) {
      console.error('Error saving reading progress:', error);
      return false;
    }
  },

  // Получить прогресс чтения книги
  async getProgress(bookId) {
    try {
      return await db.readingProgress.where('bookId').equals(bookId).first();
    } catch (error) {
      console.error('Error getting reading progress:', error);
      return null;
    }
  },

  // Получить весь прогресс чтения
  async getAllProgress() {
    try {
      return await db.readingProgress.orderBy('updatedAt').reverse().toArray();
    } catch (error) {
      console.error('Error getting all reading progress:', error);
      return [];
    }
  }
};

// Prayer times offline storage
export const offlinePrayerTimes = {
  // Сохранить время молитв
  async savePrayerTimes(date, location, times, calculationMethod) {
    try {
      const prayerData = {
        date: date.toDateString(),
        location: JSON.stringify(location),
        times: JSON.stringify(times),
        calculationMethod,
        updatedAt: new Date()
      };
      await db.prayerTimes.put(prayerData);
      return true;
    } catch (error) {
      console.error('Error saving prayer times:', error);
      return false;
    }
  },

  // Получить время молитв за дату
  async getPrayerTimes(date) {
    try {
      const result = await db.prayerTimes.where('date').equals(date.toDateString()).first();
      if (result) {
        return {
          ...result,
          location: JSON.parse(result.location),
          times: JSON.parse(result.times)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting prayer times:', error);
      return null;
    }
  }
};

// User settings storage
export const userSettings = {
  // Сохранить настройку
  async saveSetting(setting, value) {
    try {
      const settingData = {
        setting,
        value: JSON.stringify(value),
        updatedAt: new Date()
      };
      await db.userSettings.put(settingData);
      return true;
    } catch (error) {
      console.error('Error saving setting:', error);
      return false;
    }
  },

  // Получить настройку
  async getSetting(setting) {
    try {
      const result = await db.userSettings.where('setting').equals(setting).first();
      if (result) {
        return JSON.parse(result.value);
      }
      return null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  },

  // Получить все настройки
  async getAllSettings() {
    try {
      const results = await db.userSettings.toArray();
      const settings = {};
      results.forEach(item => {
        settings[item.setting] = JSON.parse(item.value);
      });
      return settings;
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }
};

// General offline content storage
export const offlineContent = {
  // Сохранить произвольный контент
  async saveContent(type, content, metadata = {}, expirationHours = 24) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const contentData = {
        type,
        content: JSON.stringify(content),
        metadata: JSON.stringify(metadata),
        downloadedAt: new Date(),
        expiresAt
      };
      await db.offlineContent.put(contentData);
      return true;
    } catch (error) {
      console.error('Error saving offline content:', error);
      return false;
    }
  },

  // Получить контент по типу
  async getContent(type) {
    try {
      const result = await db.offlineContent.where('type').equals(type).first();
      if (result && result.expiresAt > new Date()) {
        return {
          content: JSON.parse(result.content),
          metadata: JSON.parse(result.metadata),
          downloadedAt: result.downloadedAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting offline content:', error);
      return null;
    }
  },

  // Очистить устаревший контент
  async cleanupExpiredContent() {
    try {
      const now = new Date();
      await db.offlineContent.where('expiresAt').below(now).delete();
      return true;
    } catch (error) {
      console.error('Error cleaning up expired content:', error);
      return false;
    }
  }
};

// Storage management
export const storageManager = {
  // Получить размер используемого хранилища
  async getStorageSize() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting storage size:', error);
      return null;
    }
  },

  // Очистить все офлайн данные
  async clearAllOfflineData() {
    try {
      await db.books.clear();
      await db.nashids.clear();
      await db.readingProgress.clear();
      await db.prayerTimes.clear();
      await db.offlineContent.clear();
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  },

  // Получить статистику хранилища
  async getStorageStats() {
    try {
      const [books, nashids, progress, prayers, content] = await Promise.all([
        db.books.count(),
        db.nashids.count(),
        db.readingProgress.count(),
        db.prayerTimes.count(),
        db.offlineContent.count()
      ]);

      return {
        books,
        nashids,
        readingProgress: progress,
        prayerTimes: prayers,
        offlineContent: content,
        total: books + nashids + progress + prayers + content
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
};

// Network status checker
export const networkStatus = {
  // Проверить онлайн статус
  isOnline() {
    return navigator.onLine;
  },

  // Добавить слушатель изменения сетевого статуса
  addNetworkListener(callback) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Возвращаем функцию для удаления слушателей
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};

export default db;