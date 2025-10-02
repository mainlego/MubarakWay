import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBooks, toggleFavorite } from '../store/slices/booksSlice';
import BookCard from '../components/BookCard';
import { Book, Heart, Search, Filter, Star, Lock, BookOpen, Crown } from 'lucide-react';
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
    <div
      className="p-4 sm:p-6 min-h-screen bg-cover bg-center bg-no-repeat overflow-x-hidden"
      style={backgroundStyle}
    >
      <div className="max-w-4xl mx-auto w-full">
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

          {/* Фильтры */}
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all text-xs sm:text-sm ${
                showFavorites
                  ? 'bg-red-500 text-white'
                  : 'bg-white/80 text-gray-700 active:bg-white'
              }`}
            >
              <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${showFavorites ? 'fill-current' : ''}`} />
              Избранное
            </button>

            {(searchTerm || showFavorites) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowFavorites(false);
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gray-500 text-white active:bg-gray-600 transition-all text-xs sm:text-sm"
              >
                Сбросить
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
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 sm:p-6 text-white w-full">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Хотите больше? Подписка открывает</h3>
            <p className="text-green-100 text-xs sm:text-sm mb-3 sm:mb-4">
              200+ книг, эксклюзивные лекции и персональные уроки
            </p>
            <button className="bg-white text-green-600 px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium active:bg-green-50 transition-colors w-full sm:w-auto">
              Оформить подписку
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;