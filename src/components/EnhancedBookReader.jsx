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
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const savedPage = parseInt(localStorage.getItem(`currentPage_${id}`) || '1');

    if (savedTheme) setIsDarkTheme(savedTheme === 'dark');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
    if (savedPageMode !== null) setIsPageMode(savedPageMode === 'true');
    if (savedBookmarks.includes(parseInt(id))) setIsBookmarked(true);
    setCurrentPage(savedPage);
  }, [id]);

  useEffect(() => {
    if (book && book.content) {
      splitContentIntoPages(book.content);
    }
  }, [fontSize, lineHeight, book]);

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
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      localStorage.setItem(`currentPage_${id}`, newPage.toString());
      updateProgress(newPage);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      localStorage.setItem(`currentPage_${id}`, newPage.toString());
      updateProgress(newPage);
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
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const bookId = parseInt(id);

    if (isBookmarked) {
      const updatedBookmarks = bookmarks.filter(bid => bid !== bookId);
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    } else {
      bookmarks.push(bookId);
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
    setIsBookmarked(!isBookmarked);
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
    }
  };

  const downloadBook = async () => {
    if (!book) return;

    const element = document.createElement('a');
    const file = new Blob([book.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${book.title}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
    : 'text-gray-800';

  const mainStyle = isDarkTheme
    ? { backgroundColor: '#111827' }
    : backgroundStyle;

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${themeClasses}`}
      style={mainStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-sm border-b transition-all duration-300 ${
        isDarkTheme
          ? 'bg-gray-800/90 border-gray-700'
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full transition-all duration-200 ${
                isDarkTheme
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                {book.title}
                {isGuideMode && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Гид
                  </span>
                )}
              </h1>
              {book.author && (
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  {book.author}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
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
              className={`p-2 rounded-full transition-all duration-200 ${
                isDarkTheme
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
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
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-all ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkTheme
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Назад</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Страница</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                className={`w-16 px-2 py-1 text-center rounded border ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-white border-gray-300'
                }`}
              />
              <span className="text-sm">из {totalPages}</span>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkTheme
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <span className="text-sm">Вперед</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className={`absolute top-20 right-4 z-40 p-6 rounded-2xl shadow-2xl border transition-all duration-300 ${
          isDarkTheme
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="space-y-6 w-80">
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
                <Type className="w-5 h-5" />
                <span className="font-medium">Размер шрифта</span>
              </div>
              <div className="flex space-x-2">
                {[14, 16, 18, 20, 22, 24].map(size => (
                  <button
                    key={size}
                    onClick={() => changeFontSize(size)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
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
              <span className="font-medium">Межстрочный интервал</span>
              <div className="flex space-x-2">
                {[1.4, 1.6, 1.8, 2.0, 2.2].map(height => (
                  <button
                    key={height}
                    onClick={() => changeLineHeight(height)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
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

            {/* Speech rate */}
            <div className="space-y-3">
              <span className="font-medium">Скорость озвучки</span>
              <div className="flex space-x-2">
                {[0.5, 0.75, 1, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
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
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div
          ref={contentRef}
          className={`prose prose-lg max-w-none transition-all duration-300 ${
            isDarkTheme ? 'prose-invert' : ''
          }`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight
          }}
        >
          {isPageMode ? (
            <div
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
      </main>

      {/* Floating controls */}
      <div className={`fixed bottom-6 right-6 flex flex-col space-y-2`}>
        {/* Reading progress indicator */}
        <div className={`p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ${
          isDarkTheme
            ? 'bg-gray-800/90 border border-gray-700'
            : 'bg-white/90 border border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">{readingProgress}%</span>
          </div>
        </div>

        {/* Reset reading position */}
        <button
          onClick={() => goToPage(1)}
          className={`p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ${
            isDarkTheme
              ? 'bg-gray-800/90 border border-gray-700 hover:bg-gray-700'
              : 'bg-white/90 border border-gray-200 hover:bg-gray-50'
          }`}
          title="Начать сначала"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EnhancedBookReader;