import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store/store';
import { telegram } from './utils/telegram';
import { useGlobalAudio } from './hooks/useGlobalAudio';
import { loginUser, selectUser, selectIsAuthenticated } from './store/slices/authSlice';
import { setFavorites as setBooksFavorites } from './store/slices/booksSlice';
import { setFavorites as setNashidsFavorites } from './store/slices/nashidsSlice';

import Home from './pages/Home';
import Library from './pages/Library';
import Nashids from './pages/Nashids';
import Qibla from './pages/Qibla';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import EnhancedBookReader from './components/EnhancedBookReader';
import Navigation from './components/Navigation';
import TopBar from './components/TopBar';
import AudioPlayerUI from './components/AudioPlayerUI';
import ScrollToTop from './components/ScrollToTop';
import OnboardingSlides from './components/OnboardingSlides';
import TelegramLogin from './components/TelegramLogin';
import DebugPanel from './components/DebugPanel';

function AppContent() {
  console.log('[AppContent] Component rendering...');

  const dispatch = useDispatch();
  const { currentPlaying, nashids } = useSelector(state => state.nashids);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  console.log('[AppContent] Current state:', { user, isAuthenticated });

  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_completed');
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Инициализация глобального аудио (один раз на весь App)
  const audioState = useGlobalAudio();

  // Функция загрузки данных пользователя
  const loadUserData = (userData) => {
    console.log('📥 Loading user data:', userData);

    // Загружаем избранное из MongoDB
    if (userData.favorites) {
      if (userData.favorites.books) {
        dispatch(setBooksFavorites(userData.favorites.books));
      }
      if (userData.favorites.nashids) {
        dispatch(setNashidsFavorites(userData.favorites.nashids));
      }
    }
  };

  // Автоматическая авторизация при загрузке приложения
  useEffect(() => {
    console.log('[App useEffect] Effect triggered, dispatch:', !!dispatch);

    const initAuth = async () => {
      console.log('[App] 🚀 Starting authentication initialization...');

      // Проверяем Telegram Mini App
      if (telegram.isMiniApp()) {
        telegram.init();
        console.log('[App] 🔵 Telegram Mini App detected');

        const telegramUser = telegram.getUser();
        console.log('[App] 👤 Telegram user data:', telegramUser);

        if (telegramUser) {
          console.log('[App] ✅ Telegram user found, calling loginUser...');

          try {
            console.log('[App] 📤 Dispatching loginUser with:', telegramUser);
            const userData = await dispatch(loginUser(telegramUser)).unwrap();
            console.log('[App] ✅ Auto-login successful, user data:', userData);
            loadUserData(userData);
          } catch (error) {
            console.error('[App] ❌ Auto-login failed:', error);
          }
        } else {
          console.warn('[App] ⚠️ No Telegram user data available');
        }
        setIsAuthChecking(false);
      } else {
        console.log('[App] 🌐 Running in browser mode');

        // Проверяем сохраненную авторизацию
        const savedAuth = localStorage.getItem('telegram_auth');
        if (savedAuth) {
          try {
            const telegramUser = JSON.parse(savedAuth);
            console.log('🔑 Restoring session for user:', telegramUser.id);

            const userData = await dispatch(loginUser(telegramUser)).unwrap();
            console.log('✅ Session restored:', userData);
            loadUserData(userData);
            setIsAuthChecking(false);
          } catch (error) {
            console.error('❌ Session restore failed:', error);
            localStorage.removeItem('telegram_auth');
            setIsAuthChecking(false);
          }
        } else {
          // Нет сохраненной авторизации - показываем экран входа
          setIsAuthChecking(false);
        }
      }
    };

    initAuth();
  }, [dispatch]);

  useEffect(() => {
    if (currentPlaying) {
      setShowPlayer(true);
      const prevNashidId = sessionStorage.getItem('currentNashidId');
      if (prevNashidId !== String(currentPlaying.id)) {
        setIsPlayerMinimized(false);
        sessionStorage.setItem('currentNashidId', String(currentPlaying.id));
      }
    }
  }, [currentPlaying]);

  const handleClosePlayer = () => {
    setShowPlayer(false);
    setIsPlayerMinimized(false);
  };

  const handleToggleMinimize = () => {
    console.log('Toggling player minimize state from', isPlayerMinimized, 'to', !isPlayerMinimized);
    setIsPlayerMinimized(!isPlayerMinimized);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Показываем загрузку пока проверяем авторизацию
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если не в Telegram Mini App и не авторизован - показываем экран входа
  if (!telegram.isMiniApp() && !isAuthenticated) {
    return <TelegramLogin />;
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return <OnboardingSlides onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/book/:id" element={<EnhancedBookReader />} />
        <Route path="/nashids" element={<Nashids />} />
        <Route path="/qibla" element={<Qibla />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Navigation />

      {/* Глобальный аудиоплеер */}
      {showPlayer && currentPlaying && (
        <AudioPlayerUI
          nashid={currentPlaying}
          playlist={nashids}
          onClose={handleClosePlayer}
          isMinimized={isPlayerMinimized}
          onToggleMinimize={handleToggleMinimize}
          audioState={audioState}
        />
      )}

      {/* Debug панель */}
      <DebugPanel />
    </div>
  );
}

function App() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
