import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Download, BookOpen } from 'lucide-react';
import { toggleFavorite } from '../store/slices/booksSlice';

const BookCard = ({ book }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { favorites } = useSelector(state => state.books);
  const { subscription = 'free' } = useSelector(state => state.auth || {});
  const [readingProgress, setReadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isFavorite = favorites.includes(book.id);
  const canAccess = !book.isPro || subscription === 'pro';

  // Получаем прогресс чтения из localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`readingProgress_${book.id}`);
    const savedCurrentPage = localStorage.getItem(`currentPage_${book.id}`);

    if (savedProgress) {
      setReadingProgress(parseInt(savedProgress, 10));
    }
    if (savedCurrentPage) {
      setCurrentPage(parseInt(savedCurrentPage, 10));
    }

    // Приблизительное количество страниц (можно добавить в данные книги)
    if (book.content) {
      const wordsCount = book.content.split(/\s+/).length;
      const estimatedPages = Math.ceil(wordsCount / 800); // 800 слов на страницу
      setTotalPages(estimatedPages);
    }
  }, [book.id, book.content]);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(book.id));
  };

  const handleReadClick = () => {
    if (canAccess && book.content) {
      navigate(`/book/${book.id}`);
    }
  };

  const sendBookToBot = async (e) => {
    e.stopPropagation();
    if (!canAccess || !book) return;

    try {
      const botUsername = window.Telegram?.WebApp?.initDataUnsafe?.bot?.username || 'MubarakWayApp_bot';
      const deepLink = `https://t.me/${botUsername}?start=download_book_${book.id}`;

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showConfirm(
          `Отправить книгу "${book.title}" в чат с ботом?`,
          (confirmed) => {
            if (confirmed) {
              window.Telegram.WebApp.HapticFeedback?.impactOccurred('light');
              window.Telegram.WebApp.openLink(deepLink);
            }
          }
        );
      } else {
        window.open(deepLink, '_blank');
      }
    } catch (error) {
      console.error('Error sending book to bot:', error);
      alert('Ошибка при отправке книги в бот');
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-white">
      <div
        className="relative w-full h-48 bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${book.cover})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
        onError={(e) => {
          e.target.style.backgroundImage = `url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPtCa0L3QuNCz0LA8L3RleHQ+Cjwvc3ZnPgo=)`;
        }}
      >
        {book.isPro && (
          <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 left-2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">{book.title}</h3>
        {book.author && (
          <p className="text-xs sm:text-sm text-gray-600 mb-2">{book.author}</p>
        )}
        <p className="text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-2">{book.description}</p>

        {/* Прогресс чтения */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">
              {readingProgress === 100 ? 'Прочитано' : readingProgress > 0 ? 'Прогресс' : 'Не прочитано'}
            </span>
            <span className="text-xs font-medium flex items-center gap-1">
              {readingProgress === 100 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <span>✓</span> 100%
                </span>
              ) : readingProgress > 0 ? (
                <span className="text-blue-600">{readingProgress}%</span>
              ) : (
                <span className="text-gray-400">0%</span>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                readingProgress === 100
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : readingProgress > 0
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                  : 'bg-gray-300'
              }`}
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          {currentPage > 1 && totalPages > 1 && (
            <div className="text-xs text-gray-500">
              Страница {currentPage} из {totalPages}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReadClick}
            disabled={!canAccess || !book.content}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              canAccess && book.content
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            Читать
          </button>
          <button
            onClick={sendBookToBot}
            disabled={!canAccess}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              canAccess
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;