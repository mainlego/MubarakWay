import { useState, useEffect, useCallback } from 'react';
import {
  offlineBooks,
  offlineNashids,
  readingProgress,
  networkStatus,
  storageManager
} from '../services/offlineStorage';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    const removeListener = networkStatus.addNetworkListener(setIsOnline);
    return removeListener;
  }, []);

  const getStorageInfo = useCallback(async () => {
    const info = await storageManager.getStorageSize();
    setStorageInfo(info);
    return info;
  }, []);

  useEffect(() => {
    getStorageInfo();
  }, [getStorageInfo]);

  return {
    isOnline,
    storageInfo,
    getStorageInfo
  };
};

export const useOfflineBooks = () => {
  const [offlineBooksData, setOfflineBooksData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOfflineBooks = useCallback(async () => {
    setLoading(true);
    try {
      const books = await offlineBooks.getAllBooks();
      setOfflineBooksData(books);
    } catch (error) {
      console.error('Error loading offline books:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBookOffline = useCallback(async (book) => {
    try {
      const success = await offlineBooks.saveBook(book);
      if (success) {
        await loadOfflineBooks();
      }
      return success;
    } catch (error) {
      console.error('Error saving book offline:', error);
      return false;
    }
  }, [loadOfflineBooks]);

  const removeBookOffline = useCallback(async (bookId) => {
    try {
      const success = await offlineBooks.removeBook(bookId);
      if (success) {
        await loadOfflineBooks();
      }
      return success;
    } catch (error) {
      console.error('Error removing book offline:', error);
      return false;
    }
  }, [loadOfflineBooks]);

  const isBookAvailableOffline = useCallback(async (bookId) => {
    return await offlineBooks.isBookOffline(bookId);
  }, []);

  const getOfflineBook = useCallback(async (bookId) => {
    return await offlineBooks.getBook(bookId);
  }, []);

  useEffect(() => {
    loadOfflineBooks();
  }, [loadOfflineBooks]);

  return {
    offlineBooks: offlineBooksData,
    loading,
    saveBookOffline,
    removeBookOffline,
    isBookAvailableOffline,
    getOfflineBook,
    loadOfflineBooks
  };
};

export const useOfflineNashids = () => {
  const [offlineNashidsData, setOfflineNashidsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOfflineNashids = useCallback(async () => {
    setLoading(true);
    try {
      const nashids = await offlineNashids.getAllNashids();
      setOfflineNashidsData(nashids);
    } catch (error) {
      console.error('Error loading offline nashids:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveNashidOffline = useCallback(async (nashid, audioBlob) => {
    try {
      const success = await offlineNashids.saveNashid(nashid, audioBlob);
      if (success) {
        await loadOfflineNashids();
      }
      return success;
    } catch (error) {
      console.error('Error saving nashid offline:', error);
      return false;
    }
  }, [loadOfflineNashids]);

  const removeNashidOffline = useCallback(async (nashidId) => {
    try {
      const success = await offlineNashids.removeNashid(nashidId);
      if (success) {
        await loadOfflineNashids();
      }
      return success;
    } catch (error) {
      console.error('Error removing nashid offline:', error);
      return false;
    }
  }, [loadOfflineNashids]);

  const isNashidAvailableOffline = useCallback(async (nashidId) => {
    return await offlineNashids.isNashidOffline(nashidId);
  }, []);

  const getOfflineNashid = useCallback(async (nashidId) => {
    return await offlineNashids.getNashid(nashidId);
  }, []);

  useEffect(() => {
    loadOfflineNashids();
  }, [loadOfflineNashids]);

  return {
    offlineNashids: offlineNashidsData,
    loading,
    saveNashidOffline,
    removeNashidOffline,
    isNashidAvailableOffline,
    getOfflineNashid,
    loadOfflineNashids
  };
};

export const useReadingProgress = (bookId) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProgress = useCallback(async () => {
    if (!bookId) return;

    setLoading(true);
    try {
      const progressData = await readingProgress.getProgress(bookId);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading reading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  const saveProgress = useCallback(async (progressValue, currentPage = 1, lastPosition = 0) => {
    if (!bookId) return false;

    try {
      const success = await readingProgress.saveProgress(bookId, progressValue, currentPage, lastPosition);
      if (success) {
        await loadProgress();
      }
      return success;
    } catch (error) {
      console.error('Error saving reading progress:', error);
      return false;
    }
  }, [bookId, loadProgress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    saveProgress,
    loadProgress
  };
};

// Хук для автоматической синхронизации данных
export const useAutoSync = () => {
  const { isOnline } = useOffline();
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      // Здесь можно добавить логику синхронизации с сервером
      // Например, отправка локальных изменений на сервер
      // и получение обновлений с сервера

      console.log('Синхронизация данных...');

      // Симуляция синхронизации
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  useEffect(() => {
    if (isOnline) {
      // Автоматическая синхронизация при подключении к интернету
      const timer = setTimeout(sync, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, sync]);

  return {
    sync,
    lastSyncTime,
    isSyncing,
    isOnline
  };
};