import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBooks, toggleFavorite } from '../store/slices/booksSlice';
import BookCard from '../components/BookCard';
import { Book, Heart, Search, Filter, Star, Lock, BookOpen, Crown, TrendingUp, Sparkles, Globe, Award } from 'lucide-react';
import { getBackgroundWithOverlay } from '../utils/backgrounds';

const Library = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { books, favorites, loading } = useSelector(state => state.books);
  const { subscription = 'free' } = useSelector(state => state.auth || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // Новые фильтры для каталога
  const [sortBy, setSortBy] = useState('default'); // default, new, rating
  const [genreFilter, setGenreFilter] = useState('all'); // all, quran, hadith, prophets, aqidah, tafsir, islam
  const [languageFilter, setLanguageFilter] = useState('all'); // all, ru, ar, en
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false);

  useEffect(() => {
    dispatch(fetchBooks());
    setBackgroundStyle(getBackgroundWithOverlay('library', 0.4));

    // Загружаем недавние поиски
    const saved = localStorage.getItem('recentBookSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, [dispatch]);

  // Сохраняем поисковые запросы
  const saveSearch = (term) => {
    if (term.trim() && !recentSearches.includes(term)) {
      const newSearches = [term, ...recentSearches.slice(0, 4)]; // Оставляем только 5 последних
      setRecentSearches(newSearches);
      localStorage.setItem('recentBookSearches', JSON.stringify(newSearches));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveSearch(searchTerm.trim());
      setShowSearchSuggestions(false);
    }
  };

  // Фильтрация и поиск книг
  const filterBooks = (booksList) => {
    let filtered = booksList;

    // Поиск по названию, автору и описанию
    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        book.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по избранному
    if (showFavorites) {
      filtered = filtered.filter(book => favorites.includes(book.id));
    }

    // Фильтр по жанру
    if (genreFilter !== 'all') {
      filtered = filtered.filter(book => book.genre === genreFilter);
    }

    // Фильтр по языку
    if (languageFilter !== 'all') {
      filtered = filtered.filter(book => book.language === languageFilter);
    }

    // Фильтр по эксклюзиву
    if (showExclusiveOnly) {
      filtered = filtered.filter(book => book.isExclusive);
    }

    // Сортировка
    if (sortBy === 'new') {
      // Сначала новинки (isNew = true), затем по дате публикации
      filtered = [...filtered].sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return new Date(b.publishedDate) - new Date(a.publishedDate);
      });
    } else if (sortBy === 'rating') {
      // По рейтингу (количество реакций)
      filtered = [...filtered].sort((a, b) => (b.reactions || 0) - (a.reactions || 0));
    }

    return filtered;
  };

  const freeBooks = filterBooks(books.filter(book => !book.isPro));
  const proBooks = filterBooks(books.filter(book => book.isPro));

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка библиотеки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 min-h-screen overflow-x-hidden relative bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-900">
      {/* Book shelf pattern background */}
      <style>{`
        @keyframes bookShelf {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.08; }
        }
        @keyframes pageFlip {
          0%, 100% { transform: perspective(400px) rotateY(0deg); opacity: 0.1; }
          50% { transform: perspective(400px) rotateY(10deg); opacity: 0.2; }
        }
        .library-pattern {
          background-image:
            linear-gradient(90deg, rgba(139,92,246,.05) 1px, transparent 1px),
            linear-gradient(rgba(139,92,246,.05) 1px, transparent 1px);
          background-size: 80px 120px;
          animation: bookShelf 8s ease-in-out infinite;
        }
      `}</style>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 library-pattern pointer-events-none"></div>

      {/* Soft glowing orbs for depth */}
      <div className="absolute top-32 -right-20 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-32 -left-20 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 left-1/3 w-56 h-56 bg-indigo-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Библиотека</h1>

        {/* Поиск и фильтры */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4 w-full">
          {/* Строка поиска */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Поиск по названию, автору..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-xl leading-5 bg-white/90 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
            />

            {/* Подсказки поиска */}
            {showSearchSuggestions && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg z-10">
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Недавние поиски:</p>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(search);
                        setShowSearchSuggestions(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Каталог - Сортировка */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Каталог</h3>
            </div>

            {/* Сортировка */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Сортировка:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSortBy('default')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    sortBy === 'default'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  По умолчанию
                </button>
                <button
                  onClick={() => setSortBy('new')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    sortBy === 'new'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Новинки
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    sortBy === 'rating'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  По рейтингу
                </button>
              </div>
            </div>

            {/* Жанр */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Жанр:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setGenreFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    genreFilter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setGenreFilter('quran')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    genreFilter === 'quran'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  Коран
                </button>
                <button
                  onClick={() => setGenreFilter('hadith')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    genreFilter === 'hadith'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  Хадисы
                </button>
                <button
                  onClick={() => setGenreFilter('islam')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    genreFilter === 'islam'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  Про ислам
                </button>
                <button
                  onClick={() => setGenreFilter('aqidah')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    genreFilter === 'aqidah'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  Акыда
                </button>
              </div>
            </div>

            {/* Язык */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Язык:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLanguageFilter('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    languageFilter === 'all'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  Все
                </button>
                <button
                  onClick={() => setLanguageFilter('ru')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    languageFilter === 'ru'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  Русский
                </button>
                <button
                  onClick={() => setLanguageFilter('ar')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    languageFilter === 'ar'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  العربية
                </button>
                <button
                  onClick={() => setLanguageFilter('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    languageFilter === 'en'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Дополнительные фильтры */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowExclusiveOnly(!showExclusiveOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  showExclusiveOnly
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-700 active:bg-gray-100'
                }`}
              >
                <Award className="w-3 h-3" />
                Эксклюзив
              </button>
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  showFavorites
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-700 active:bg-gray-100'
                }`}
              >
                <Heart className={`w-3 h-3 ${showFavorites ? 'fill-current' : ''}`} />
                Избранное
              </button>
            </div>

            {/* Кнопка сброса фильтров */}
            {(searchTerm || showFavorites || sortBy !== 'default' || genreFilter !== 'all' || languageFilter !== 'all' || showExclusiveOnly) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowFavorites(false);
                  setSortBy('default');
                  setGenreFilter('all');
                  setLanguageFilter('all');
                  setShowExclusiveOnly(false);
                }}
                className="mt-3 w-full bg-gray-500 text-white px-4 py-2 rounded-lg text-xs active:bg-gray-600 transition-all"
              >
                Сбросить все фильтры
              </button>
            )}
          </div>

          {/* Результаты поиска */}
          {searchTerm && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3">
              <p className="text-sm text-gray-600">
                Найдено книг: <span className="font-semibold">{freeBooks.length + proBooks.length}</span>
                {searchTerm && ` по запросу "${searchTerm}"`}
              </p>
            </div>
          )}
        </div>

        {/* Free Books Section */}
        {freeBooks.length > 0 && (
          <section className="mb-6 sm:mb-8 w-full">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Бесплатные книги ({freeBooks.length})
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full">
              {freeBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}

        {/* Pro Books Section */}
        {proBooks.length > 0 && (
          <section className="mb-6 sm:mb-8 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Книги PRO ({proBooks.length})
                </h2>
              </div>
              {subscription === 'free' && (
                <button className="bg-gradient-to-r from-green-500 to-green-600 active:from-green-600 active:to-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                  Подписка
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full">
              {proBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}

        {/* Сообщение если ничего не найдено */}
        {freeBooks.length === 0 && proBooks.length === 0 && (searchTerm || showFavorites) && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {showFavorites ? 'Нет избранных книг' : 'Книги не найдены'}
            </h3>
            <p className="text-white/80 mb-4">
              {showFavorites
                ? 'Добавьте книги в избранное, нажав на сердечко'
                : `По запросу "${searchTerm}" ничего не найдено`
              }
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setShowFavorites(false);
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
            >
              Показать все книги
            </button>
          </div>
        )}

        {/* Subscription Banner */}
        {subscription === 'free' && (
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 sm:p-6 text-white w-full mb-20">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Хотите больше? Подписка открывает</h3>
            <p className="text-green-100 text-xs sm:text-sm mb-3 sm:mb-4">
              200+ книг, эксклюзивные лекции и персональные уроки
            </p>
            <button className="bg-white text-green-600 px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium active:bg-green-50 transition-colors w-full sm:w-auto">
              Оформить подписку
            </button>
          </div>
        )}

        {/* Bottom spacing for navigation */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default Library;