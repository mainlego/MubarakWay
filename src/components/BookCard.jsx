import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Download, BookOpen } from 'lucide-react';
import { toggleFavorite } from '../store/slices/booksSlice';

const BookCard = ({ book }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { favorites } = useSelector(state => state.books);
  const { subscription = 'free' } = useSelector(state => state.auth || {});

  const isFavorite = favorites.includes(book.id);
  const canAccess = !book.isPro || subscription === 'pro';

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(book.id));
  };

  const handleReadClick = () => {
    if (canAccess && book.content) {
      navigate(`/book/${book.id}`);
    }
  };

  const handleGuideClick = (e) => {
    e.stopPropagation();
    if (canAccess && book.content) {
      navigate(`/book/${book.id}?guide=true`);
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
        <p className="text-xs text-gray-500 mb-3 sm:mb-4 line-clamp-2">{book.description}</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleReadClick}
            disabled={!canAccess || !book.content}
            className={`w-full flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              canAccess && book.content
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            Читать
          </button>
          <div className="flex gap-2">
            {book.content && (
              <button
                onClick={handleGuideClick}
                disabled={!canAccess}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  canAccess
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Гид
              </button>
            )}
            <button
              disabled={!canAccess}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${
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
    </div>
  );
};

export default BookCard;