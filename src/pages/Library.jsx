import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks } from '../store/slices/booksSlice';
import BookCard from '../components/BookCard';
import { Lock, Crown } from 'lucide-react';

const Library = () => {
  const dispatch = useDispatch();
  const { books, loading } = useSelector(state => state.books);
  const { subscription } = useSelector(state => state.auth);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  const freeBooks = books.filter(book => !book.isPro);
  const proBooks = books.filter(book => book.isPro);

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
      className="p-6 min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(/src/assets/images/background_library.jpg)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Библиотека</h1>

        {/* Free Books Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">Бесплатные книги</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {freeBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>

        {/* Pro Books Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Книги PRO</h2>
            </div>
            {subscription === 'free' && (
              <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
                <Lock className="w-4 h-4 inline mr-2" />
                Оформить подписку
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {proBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>

        {/* Subscription Banner */}
        {subscription === 'free' && (
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Хотите больше? Подписка открывает</h3>
            <p className="text-green-100 mb-4">
              200+ книг, эксклюзивные лекции и персональные уроки
            </p>
            <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors">
              Оформить подписку
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;