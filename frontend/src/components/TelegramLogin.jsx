import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { setFavorites as setBooksFavorites } from '../store/slices/booksSlice';
import { setFavorites as setNashidsFavorites } from '../store/slices/nashidsSlice';

const TelegramLogin = () => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  useEffect(() => {
    // Callback функция для Telegram Login Widget
    window.onTelegramAuth = (user) => {
      console.log('✅ Telegram Login successful:', user);

      // Преобразуем данные в нужный формат
      const telegramUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        auth_date: user.auth_date,
        hash: user.hash
      };

      // Авторизуем пользователя
      dispatch(loginUser(telegramUser))
        .unwrap()
        .then((userData) => {
          console.log('✅ User logged in successfully:', userData);

          // Загружаем данные пользователя
          if (userData.favorites) {
            if (userData.favorites.books) {
              dispatch(setBooksFavorites(userData.favorites.books));
            }
            if (userData.favorites.nashids) {
              dispatch(setNashidsFavorites(userData.favorites.nashids));
            }
          }

          // Сохраняем состояние авторизации
          localStorage.setItem('telegram_auth', JSON.stringify(telegramUser));
        })
        .catch((error) => {
          console.error('❌ Login failed:', error);
        });
    };

    // Создаем скрипт для Telegram Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'MubarakWayApp_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      // Очистка
      if (containerRef.current && containerRef.current.contains(script)) {
        containerRef.current.removeChild(script);
      }
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Logo/Icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Mubarak Way
            </h1>
            <p className="text-white/70 text-sm">
              Добро пожаловать в исламское приложение
            </p>
          </div>

          {/* Description */}
          <div className="mb-6 text-center">
            <p className="text-white/80 text-sm mb-4">
              Для использования приложения необходимо войти через Telegram
            </p>
          </div>

          {/* Telegram Login Button */}
          <div className="flex justify-center mb-6" ref={containerRef}>
            {/* Telegram Widget будет вставлен сюда */}
          </div>

          {/* Features */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Доступ к исламской библиотеке</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Нашиды и духовная музыка</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Расписание молитв и Кибла</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Синхронизация между устройствами</span>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              Мы используем Telegram для безопасной авторизации.
              Ваши данные защищены и не передаются третьим лицам.
            </p>
          </div>

          {/* Debug Mode Button (Development Only) */}
          {import.meta.env.DEV && (
            <div className="mt-4">
              <button
                onClick={() => {
                  console.log('[DEBUG] Entering debug mode with test user');
                  const testUser = {
                    id: 123456789,
                    first_name: 'Debug',
                    last_name: 'User',
                    username: 'debuguser',
                    photo_url: '',
                    auth_date: Math.floor(Date.now() / 1000),
                    hash: 'debug_hash'
                  };

                  dispatch(loginUser(testUser))
                    .unwrap()
                    .then((userData) => {
                      console.log('✅ Debug user logged in:', userData);
                      localStorage.setItem('telegram_auth', JSON.stringify(testUser));
                    })
                    .catch((error) => {
                      console.error('❌ Debug login failed:', error);
                    });
                }}
                className="w-full py-3 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-200 rounded-lg text-sm font-medium transition-colors"
              >
                🔧 Режим отладки (только для разработки)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramLogin;
