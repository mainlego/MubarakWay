import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Lock, Download } from 'lucide-react';
import { toggleFavorite } from '../store/slices/booksSlice';

const BookCard = ({ book }) => {
  const dispatch = useDispatch();
  const { favorites } = useSelector(state => state.books);
  const { subscription } = useSelector(state => state.auth);

  const isFavorite = favorites.includes(book.id);
  const canAccess = !book.isPro || subscription === 'pro';

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(book.id));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
      <div className="relative">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPtCa0L3QuNCz0LA8L3RleHQ+Cjwvc3ZnPgo=';
          }}
        />
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

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
        {book.author && (
          <p className="text-sm text-gray-600 mb-2">{book.author}</p>
        )}
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{book.description}</p>

        <div className="flex gap-2">
          <button
            disabled={!canAccess}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              canAccess
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Читать
          </button>
          <button
            disabled={!canAccess}
            className={`p-2 rounded-lg transition-colors ${
              canAccess
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;