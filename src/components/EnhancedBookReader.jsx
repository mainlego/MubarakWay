import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  Type,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Share2,
  Volume2,
  VolumeX,
  CloudDownload,
  HardDrive,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getBackgroundWithOverlay } from '../utils/backgrounds';
// import { useOfflineBooks, useReadingProgress, useOffline } from '../hooks/useOffline';

const EnhancedBookReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const books = useSelector(state => state.books.books);
  const contentRef = useRef(null);
  const [book, setBook] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSettings, setShowSettings] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isGuideMode, setIsGuideMode] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState({});

  // Постраничная навигация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pages, setPages] = useState([]);
  const [isPageMode, setIsPageMode] = useState(true);
  const [pageTransition, setPageTransition] = useState('');

  // Аудио функции
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);

  // Офлайн функциональность (упрощенная версия)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);

  // Простые функции вместо хуков
  const saveBookOffline = async (book) => {
    try {
      localStorage.setItem(`offline_book_${book.id}`, JSON.stringify(book));
      return true;
    } catch (error) {
      console.error('Error saving book offline:', error);
      return false;
    }
  };

  const removeBookOffline = async (bookId) => {
    try {
      localStorage.removeItem(`offline_book_${bookId}`);
      return true;
    } catch (error) {
      console.error('Error removing book offline:', error);
      return false;
    }
  };

  const isBookAvailableOffline = async (bookId) => {
    return localStorage.getItem(`offline_book_${bookId}`) !== null;
  };

  const getOfflineBook = async (bookId) => {
    try {
      const bookData = localStorage.getItem(`offline_book_${bookId}`);
      return bookData ? JSON.parse(bookData) : null;
    } catch (error) {
      console.error('Error getting offline book:', error);
      return null;
    }
  };

  const saveReadingProgress = async (progress, page, position) => {
    try {
      const progressData = { progress, page, position, timestamp: Date.now() };
      localStorage.setItem(`reading_progress_${id}`, JSON.stringify(progressData));
      return true;
    } catch (error) {
      console.error('Error saving reading progress:', error);
      return false;
    }
  };

  // Swipe navigation
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    const loadBook = async () => {
      let foundBook = books.find(b => b.id === parseInt(id));

      // Если книга не найдена онлайн, попробуем загрузить из офлайн хранилища
      if (!foundBook && !isOnline) {
        foundBook = await getOfflineBook(parseInt(id));
      }

      if (foundBook && foundBook.content) {
        setBook(foundBook);
        splitContentIntoPages(foundBook.content);
      }

      // Проверяем, доступна ли книга офлайн
      const offlineAvailable = await isBookAvailableOffline(parseInt(id));
      setIsOfflineAvailable(offlineAvailable);
    };

    loadBook();
    const searchParams = new URLSearchParams(location.search);
    setIsGuideMode(searchParams.get('guide') === 'true');
    setBackgroundStyle(getBackgroundWithOverlay('reader', 0.2));
  }, [id, books, location.search]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('readerTheme');
    const savedFontSize = localStorage.getItem('readerFontSize');
    const savedLineHeight = localStorage.getItem('readerLineHeight');
    const savedPageMode = localStorage.getItem('readerPageMode');
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
    const savedPage = parseInt(localStorage.getItem(`currentPage_${id}`) || '1');

    if (savedTheme) setIsDarkTheme(savedTheme === 'dark');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
    if (savedPageMode !== null) setIsPageMode(savedPageMode === 'true');

    // Проверяем закладку и восстанавливаем позицию если есть
    const bookId = parseInt(id);
    if (savedBookmarks[bookId]) {
      setIsBookmarked(true);
      // Восстанавливаем страницу из закладки, если текущая позиция не сохранена
      if (savedPage === 1 && savedBookmarks[bookId].page > 1) {
        setCurrentPage(savedBookmarks[bookId].page);
      }
    } else {
      setCurrentPage(savedPage);
    }
  }, [id]);

  useEffect(() => {
    if (book && book.content) {
      splitContentIntoPages(book.content);
    }
  }, [fontSize, lineHeight, book]);

  // Восстановление прогресса чтения при загрузке
  useEffect(() => {
    if (totalPages > 0 && currentPage > 1) {
      // Небольшая задержка, чтобы страница успела отрендериться
      const timer = setTimeout(() => {
        const savedProgress = parseInt(localStorage.getItem(`readingProgress_${id}`) || '0');
        if (savedProgress > 0) {
          setReadingProgress(savedProgress);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [totalPages, id]);

  // Отслеживание онлайн статуса
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const splitContentIntoPages = useCallback((content) => {
    let htmlContent;
    let cleanContent;

    try {
      htmlContent = marked(content, { breaks: true, gfm: true });
      cleanContent = DOMPurify.sanitize(htmlContent);
    } catch (error) {
      console.error('Error processing content:', error);
      // Fallback: используем простую замену переносов строк
      cleanContent = content.replace(/\n/g, '<br>');
    }

    // Приблизительное разделение на страницы (примерно 800 слов на страницу)
    const wordsPerPage = 800;
    const words = cleanContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(word => word.length > 0);
    const pageCount = Math.ceil(words.length / wordsPerPage);

    const newPages = [];
    for (let i = 0; i < pageCount; i++) {
      const startWord = i * wordsPerPage;
      const endWord = Math.min(startWord + wordsPerPage, words.length);
      const pageWords = words.slice(startWord, endWord);

      // Восстанавливаем HTML разметку для каждой страницы
      let pageContent = pageWords.join(' ');
      newPages.push(pageContent);
    }

    setPages(newPages);
    setTotalPages(pageCount);
  }, []);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setPageTransition('slide-left');
      setTimeout(() => {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        localStorage.setItem(`currentPage_${id}`, newPage.toString());
        updateProgress(newPage);
        // Прокрутка к началу страницы
        window.scrollTo({ top: 0, behavior: 'instant' });
        setPageTransition('');
      }, 150);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setPageTransition('slide-right');
      setTimeout(() => {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        localStorage.setItem(`currentPage_${id}`, newPage.toString());
        updateProgress(newPage);
        // Прокрутка к началу страницы
        window.scrollTo({ top: 0, behavior: 'instant' });
        setPageTransition('');
      }, 150);
    }
  };

  const updateProgress = async (page) => {
    const progress = Math.round((page / totalPages) * 100);
    setReadingProgress(progress);
    localStorage.setItem(`readingProgress_${id}`, progress.toString());

    // Сохраняем прогресс в IndexedDB
    await saveReadingProgress(progress, page, 0);
  };

  // Swipe handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < totalPages) {
      nextPage();
    }
    if (isRightSwipe && currentPage > 1) {
      prevPage();
    }
  };

  // Альтернативный метод для свайпов через pointer events
  useEffect(() => {
    let startX = 0;
    let endX = 0;

    const handlePointerDown = (e) => {
      startX = e.clientX;
    };

    const handlePointerUp = (e) => {
      endX = e.clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const diffX = startX - endX;

      if (Math.abs(diffX) > 50) { // минимальная дистанция для свайпа
        if (diffX > 0 && currentPage < totalPages) {
          // Свайп влево - следующая страница
          nextPage();
        } else if (diffX < 0 && currentPage > 1) {
          // Свайп вправо - предыдущая страница
          prevPage();
        }
      }
    };

    const element = document.getElementById('book-reader-content');
    if (element && isPageMode) {
      element.addEventListener('pointerdown', handlePointerDown);
      element.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      if (element) {
        element.removeEventListener('pointerdown', handlePointerDown);
        element.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [currentPage, totalPages, isPageMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('readerTheme', newTheme ? 'dark' : 'light');
  };

  const changeFontSize = (newSize) => {
    setFontSize(newSize);
    localStorage.setItem('readerFontSize', newSize.toString());
  };

  const changeLineHeight = (newHeight) => {
    setLineHeight(newHeight);
    localStorage.setItem('readerLineHeight', newHeight.toString());
  };

  const togglePageMode = () => {
    const newMode = !isPageMode;
    setIsPageMode(newMode);
    localStorage.setItem('readerPageMode', newMode.toString());
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
    const bookId = parseInt(id);

    if (isBookmarked) {
      // Удаляем закладку
      delete bookmarks[bookId];
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      setIsBookmarked(false);
    } else {
      // Сохраняем закладку с текущей позицией
      bookmarks[bookId] = {
        page: currentPage,
        progress: readingProgress,
        timestamp: Date.now()
      };
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      setIsBookmarked(true);
      // Показываем уведомление
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(`Закладка сохранена на странице ${currentPage}`);
      }
    }
  };

  // Text-to-Speech функционал
  const toggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert('Функция озвучки не поддерживается в этом браузере');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const text = pages[currentPage - 1] || '';
      const cleanText = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');

      if (!cleanText.trim()) {
        alert('Нет текста для озвучки');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speechRate;
      utterance.lang = 'ru-RU';

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setIsPlaying(false);
        console.error('Ошибка озвучки');
      };

      try {
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      } catch (error) {
        console.error('Error starting speech:', error);
        setIsPlaying(false);
      }
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      localStorage.setItem(`currentPage_${id}`, pageNum.toString());
      updateProgress(pageNum);
      // Прокрутка к началу при переходе на страницу
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const downloadBook = async () => {
    if (!book) return;

    try {
      const element = document.createElement('a');
      // Используем правильную кодировку UTF-8 с BOM для корректного отображения кириллицы
      const BOM = '\uFEFF';
      const content = BOM + book.content;
      const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `${book.title}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    } catch (error) {
      console.error('Error downloading book:', error);
      alert('Ошибка при скачивании книги');
    }
  };

  const toggleOfflineAccess = async () => {
    if (!book) return;

    if (isOfflineAvailable) {
      // Удаляем из офлайн хранилища
      const success = await removeBookOffline(book.id);
      if (success) {
        setIsOfflineAvailable(false);
      }
    } else {
      // Сохраняем в офлайн хранилище
      const success = await saveBookOffline(book);
      if (success) {
        setIsOfflineAvailable(true);
      }
    }
  };

  const shareBook = async () => {
    if (!book) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: book.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-green-600 animate-pulse" />
          <p className="text-xl text-gray-600">Книга не найдена</p>
        </div>
      </div>
    );
  }

  const themeClasses = isDarkTheme
    ? 'bg-gray-900 text-gray-100'
    : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-800';

  const mainStyle = isDarkTheme
    ? {
        background: 'linear-gradient(135deg, #1a1f2e 0%, #151820 100%)',
        minHeight: '100vh'
      }
    : {
        background: 'linear-gradient(135deg, #fdfbfb 0%, #f5f7fa 100%)',
        minHeight: '100vh'
      };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${themeClasses}`}
      style={mainStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 shadow-lg ${
        isDarkTheme
          ? 'bg-gray-900/95 border-gray-700'
          : 'bg-white/95 border-gray-300'
      }`}>
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-xl transition-all duration-200 shrink-0 touch-manipulation ${
                isDarkTheme
                  ? 'hover:bg-gray-800 active:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 active:bg-gray-200 text-gray-600'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-bold text-sm sm:text-lg truncate">
                  {book.title}
                </h1>
                {isGuideMode && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shrink-0">
                    Гид
                  </span>
                )}
              </div>
              {book.author && (
                <p className={`text-xs sm:text-sm truncate ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  {book.author}
                </p>
              )}
            </div>
          </div>

          {/* Mobile-optimized controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Essential controls visible on mobile */}
            <div className="flex items-center space-x-1 sm:hidden">
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-full transition-all duration-200 touch-manipulation ${
                  isBookmarked
                    ? 'text-yellow-500 bg-yellow-100 active:bg-yellow-200'
                    : isDarkTheme
                      ? 'hover:bg-gray-700 active:bg-gray-600 text-gray-300'
                      : 'hover:bg-gray-100 active:bg-gray-200 text-gray-600'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full transition-all duration-200 touch-manipulation ${
                  isDarkTheme
                    ? 'hover:bg-gray-700 active:bg-gray-600 text-gray-300'
                    : 'hover:bg-gray-100 active:bg-gray-200 text-gray-600'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Full controls for larger screens */}
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={toggleSpeech}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isPlaying
                    ? 'text-blue-500 bg-blue-100'
                    : isDarkTheme
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={shareBook}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkTheme
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={downloadBook}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkTheme
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Скачать книгу"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={toggleOfflineAccess}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isOfflineAvailable
                    ? 'text-green-500 bg-green-100'
                    : isDarkTheme
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={isOfflineAvailable ? 'Удалить из офлайн хранилища' : 'Сохранить для офлайн чтения'}
              >
                {isOfflineAvailable ? <HardDrive className="w-5 h-5" /> : <CloudDownload className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isBookmarked
                    ? 'text-yellow-500 bg-yellow-100'
                    : isDarkTheme
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full transition-all duration-200 touch-manipulation ${
                  isDarkTheme
                    ? 'hover:bg-gray-700 active:bg-gray-600 text-gray-300'
                    : 'hover:bg-gray-100 active:bg-gray-200 text-gray-600'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`h-1 ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Page Navigation */}
        {isPageMode && (
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            {/* Mobile navigation - only page indicator */}
            <div className="sm:hidden flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 px-3 py-2 rounded-lg">
                <span className="text-xs font-medium">Страница</span>
                <span className="text-sm font-bold">{currentPage}</span>
                <span className="text-xs text-gray-500">/</span>
                <span className="text-sm font-medium">{totalPages}</span>
              </div>
            </div>

            {/* Desktop navigation - full featured */}
            <div className="hidden sm:flex items-center justify-between">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all transform hover:scale-105 ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkTheme
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 shadow-md'
                      : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Назад</span>
              </button>

              <div className="flex items-center space-x-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 px-4 py-2 rounded-xl">
                <span className="text-sm font-medium">Страница</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => goToPage(parseInt(e.target.value))}
                  className={`w-20 px-3 py-1 text-center rounded-lg font-medium transition-all ${
                    isDarkTheme
                      ? 'bg-gray-800 border-gray-600 text-gray-200 focus:ring-2 focus:ring-green-500'
                      : 'bg-white border-gray-300 focus:ring-2 focus:ring-green-500'
                  }`}
                />
                <span className="text-sm font-medium">из {totalPages}</span>
              </div>

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all transform hover:scale-105 ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkTheme
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 shadow-md'
                      : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                }`}
              >
                <span className="text-sm font-medium">Вперед</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Settings panel */}
      {showSettings && (
        <>
          {/* Mobile overlay */}
          <div
            className="sm:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowSettings(false)}
          />

          {/* Settings panel */}
          <div className={`
            absolute z-40 backdrop-blur-lg border transition-all duration-300
            sm:top-20 sm:right-4 sm:rounded-2xl sm:w-80 sm:p-6
            max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-2xl max-sm:p-4 max-sm:max-h-[80vh] max-sm:overflow-y-auto
            shadow-2xl
            ${
              isDarkTheme
                ? 'bg-gray-900/95 border-gray-700'
                : 'bg-white/95 border-gray-300'
            }
          `}>
            {/* Mobile close button */}
            <div className="sm:hidden flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg">Настройки</h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-lg ${
                  isDarkTheme
                    ? 'hover:bg-gray-800 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                ×
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6 sm:w-full">
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Тема</span>
              <button
                onClick={toggleTheme}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
                  isDarkTheme
                    ? 'bg-gray-700 text-yellow-400'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span>{isDarkTheme ? 'Темная' : 'Светлая'}</span>
              </button>
            </div>

            {/* Page mode toggle */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Режим страниц</span>
              <button
                onClick={togglePageMode}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isPageMode
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                    : isDarkTheme
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {isPageMode ? 'Включен' : 'Выключен'}
              </button>
            </div>

            {/* Font size */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">Размер шрифта</span>
              </div>
              <div className="grid grid-cols-3 sm:flex gap-2 sm:space-x-2">
                {[14, 16, 18, 20, 22, 24].map(size => (
                  <button
                    key={size}
                    onClick={() => changeFontSize(size)}
                    className={`px-2 py-2 sm:px-3 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                      fontSize === size
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                        : isDarkTheme
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Line height */}
            <div className="space-y-3">
              <span className="font-medium text-sm sm:text-base">Межстрочный интервал</span>
              <div className="grid grid-cols-3 sm:flex gap-2 sm:space-x-2">
                {[1.4, 1.6, 1.8, 2.0, 2.2].map(height => (
                  <button
                    key={height}
                    onClick={() => changeLineHeight(height)}
                    className={`px-2 py-2 sm:px-3 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                      lineHeight === height
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                        : isDarkTheme
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {height}
                  </button>
                ))}
              </div>
            </div>

            {/* Speech rate - only show on larger screens or in expanded mobile view */}
            <div className="space-y-3 sm:block hidden">
              <span className="font-medium text-sm sm:text-base">Скорость озвучки</span>
              <div className="grid grid-cols-3 sm:flex gap-2 sm:space-x-2">
                {[0.5, 0.75, 1, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-2 sm:px-3 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                      speechRate === rate
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                        : isDarkTheme
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile actions row */}
            <div className="sm:hidden flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={toggleSpeech}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isPlaying
                    ? 'text-blue-500 bg-blue-100'
                    : isDarkTheme
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>Озвучка</span>
              </button>

              <button
                onClick={shareBook}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isDarkTheme
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Поделиться</span>
              </button>

              <button
                onClick={downloadBook}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isDarkTheme
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Скачать</span>
              </button>
            </div>

            {/* Reading progress */}
            <div className="text-center">
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                Прогресс чтения: {readingProgress}%
              </p>
              <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                Страница {currentPage} из {totalPages}
              </p>
            </div>

            {/* Офлайн статус */}
            <div className="flex items-center justify-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs ${
                isOnline
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {isOnline ? 'Онлайн' : 'Офлайн'}
              </span>
            </div>

            {/* Офлайн доступ */}
            <div className="flex items-center justify-center space-x-2">
              {isOfflineAvailable ? (
                <HardDrive className="w-4 h-4 text-green-500" />
              ) : (
                <CloudDownload className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-xs ${
                isOfflineAvailable
                  ? 'text-green-500'
                  : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {isOfflineAvailable ? 'Доступно офлайн' : 'Только онлайн'}
              </span>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <main
        id="book-reader-content"
        className="max-w-4xl mx-auto px-3 py-4 sm:px-6 sm:py-8 touch-pan-y"
        style={{ touchAction: 'pan-y', minHeight: 'calc(100vh - 200px)' }}
      >
        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg sm:shadow-xl transition-all duration-300 ${
          isDarkTheme
            ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700'
            : 'bg-white/80 backdrop-blur-sm border border-gray-200'
        }`} style={{ minHeight: '400px' }}>
          <div
            ref={contentRef}
            className={`prose prose-sm sm:prose-lg max-w-none transition-all duration-300 ${
              isDarkTheme
                ? 'prose-invert prose-p:text-gray-300 prose-headings:text-gray-100 prose-h1:text-xl sm:prose-h1:text-3xl prose-h2:text-lg sm:prose-h2:text-2xl prose-h3:text-base sm:prose-h3:text-xl'
                : 'prose-p:text-gray-700 prose-headings:text-gray-900 prose-h1:text-xl sm:prose-h1:text-3xl prose-h2:text-lg sm:prose-h2:text-2xl prose-h3:text-base sm:prose-h3:text-xl'
            }`}
            style={{
              fontSize: `${Math.max(fontSize - 2, 14)}px`,
              lineHeight: lineHeight,
              fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif'
            }}
        >
          {isPageMode ? (
            <div
              className={`transition-all duration-300 ${
                pageTransition === 'slide-left' ? 'opacity-0 -translate-x-4' :
                pageTransition === 'slide-right' ? 'opacity-0 translate-x-4' :
                'opacity-100 translate-x-0'
              }`}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  try {
                    return DOMPurify.sanitize(marked(pages[currentPage - 1] || '', { breaks: true, gfm: true }));
                  } catch (error) {
                    console.error('Error rendering page content:', error);
                    return (pages[currentPage - 1] || '').replace(/\n/g, '<br>');
                  }
                })()
              }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: (() => {
                  try {
                    return DOMPurify.sanitize(marked(book.content, { breaks: true, gfm: true }));
                  } catch (error) {
                    console.error('Error rendering book content:', error);
                    return book.content.replace(/\n/g, '<br>');
                  }
                })()
              }}
            />
          )}
          </div>
        </div>
      </main>

      {/* Floating controls - mobile optimized - поднято выше навигации */}
      <div className={`fixed bottom-20 right-3 sm:bottom-6 sm:right-6 flex flex-col space-y-2 z-40`}>
        {/* Reading progress indicator */}
        <div className={`p-2 sm:p-3 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
          isDarkTheme
            ? 'bg-gray-900/95 border border-gray-700'
            : 'bg-white/95 border border-gray-300'
        }`}>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{readingProgress}%</span>
          </div>
        </div>

        {/* Reset reading position */}
        <button
          onClick={() => goToPage(1)}
          className={`p-2 sm:p-3 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
            isDarkTheme
              ? 'bg-gray-900/95 border border-gray-700 hover:bg-gray-800'
              : 'bg-white/95 border border-gray-300 hover:bg-gray-100'
          }`}
          title="Начать сначала"
        >
          <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Mobile swipe indicator - показывается только на мобильных */}
      <div className="sm:hidden fixed bottom-28 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div className={`flex items-center space-x-4 px-4 py-2 rounded-full text-xs backdrop-blur-sm transition-all duration-300 ${
          isDarkTheme
            ? 'bg-gray-900/90 text-gray-200 border border-gray-600'
            : 'bg-white/90 text-gray-700 border border-gray-300 shadow-lg'
        }`}>
          <div className={`flex items-center space-x-1 transition-opacity ${
            currentPage > 1 ? 'opacity-100' : 'opacity-30'
          }`}>
            <ChevronLeft className="w-4 h-4" />
            <span>Свайп</span>
          </div>
          <div className="w-px h-4 bg-gray-400" />
          <div className={`flex items-center space-x-1 transition-opacity ${
            currentPage < totalPages ? 'opacity-100' : 'opacity-30'
          }`}>
            <span>Свайп</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookReader;