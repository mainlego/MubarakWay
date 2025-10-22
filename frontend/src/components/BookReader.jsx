import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  Type,
  Bookmark,
  BookOpen,
  FileText,
  File
} from 'lucide-react';
import { getBackgroundWithOverlay } from '../utils/backgrounds';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const BookReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('text'); // 'text' or 'pdf'
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState({});

  useEffect(() => {
    fetchBook();
    setBackgroundStyle(getBackgroundWithOverlay('reader', 0.2));
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/books/${id}`);
      if (response.data.success) {
        setBook(response.data.book);
        // Если нет извлеченного текста, переключаемся на PDF режим
        if (!response.data.book.extractedText) {
          setViewMode('pdf');
        }
      }
    } catch (error) {
      console.error('Failed to fetch book:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('readerTheme');
    const savedFontSize = localStorage.getItem('readerFontSize');
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

    if (savedTheme) setIsDarkTheme(savedTheme === 'dark');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedBookmarks.includes(parseInt(id))) setIsBookmarked(true);
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.round(progress));

      // Save reading progress
      localStorage.setItem(`readingProgress_${id}`, progress.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('readerTheme', newTheme ? 'dark' : 'light');
  };

  const changeFontSize = (newSize) => {
    setFontSize(newSize);
    localStorage.setItem('readerFontSize', newSize.toString());
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

  const renderText = (text) => {
    // Разделяем текст на параграфы и форматируем
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-green-600 animate-pulse" />
          <p className="text-xl text-gray-600">Загрузка книги...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <p className="text-xl text-gray-600">Книга не найдена</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Назад
          </button>
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
    <div className={`min-h-screen transition-all duration-300 ${themeClasses}`} style={mainStyle}>
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
            {/* Toggle между текстом и PDF */}
            {book.extractedText && book.content && (
              <button
                onClick={() => setViewMode(viewMode === 'text' ? 'pdf' : 'text')}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkTheme
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={viewMode === 'text' ? 'Показать PDF' : 'Показать текст'}
              >
                {viewMode === 'text' ? <File className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </button>
            )}
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
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className={`absolute top-20 right-4 z-40 p-6 rounded-2xl shadow-2xl border transition-all duration-300 ${
          isDarkTheme
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="space-y-6 w-64">
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

            {/* Reading progress */}
            <div className="text-center">
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                Прогресс чтения: {readingProgress}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {viewMode === 'text' && book.extractedText ? (
          <div
            className={`prose prose-lg max-w-none transition-all duration-300 ${
              isDarkTheme ? 'prose-invert' : ''
            }`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: '1.8'
            }}
          >
            {renderText(book.extractedText)}
          </div>
        ) : viewMode === 'pdf' && book.content ? (
          <div className="w-full">
            <iframe
              src={book.content}
              className="w-full rounded-lg shadow-lg"
              style={{ minHeight: '80vh' }}
              title={book.title}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
              Контент книги недоступен
            </p>
          </div>
        )}
      </main>

      {/* Floating reading info */}
      <div className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ${
        isDarkTheme
          ? 'bg-gray-800/90 border border-gray-700'
          : 'bg-white/90 border border-gray-200'
      }`}>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">{readingProgress}%</span>
        </div>
      </div>
    </div>
  );
};

export default BookReader;