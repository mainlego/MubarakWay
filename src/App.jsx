import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store/store';
import { telegram } from './utils/telegram';
import { useGlobalAudio } from './hooks/useGlobalAudio';
import { loginUser } from './store/slices/authSlice';

import Home from './pages/Home';
import Library from './pages/Library';
import Nashids from './pages/Nashids';
import Qibla from './pages/Qibla';
import Subscription from './pages/Subscription';
import EnhancedBookReader from './components/EnhancedBookReader';
import Navigation from './components/Navigation';
import AudioPlayerUI from './components/AudioPlayerUI';
import ScrollToTop from './components/ScrollToTop';
import OnboardingSlides from './components/OnboardingSlides';

function AppContent() {
  const dispatch = useDispatch();
  const { currentPlaying, nashids } = useSelector(state => state.nashids);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_completed');
  });

  // Инициализация глобального аудио (один раз на весь App)
  const audioState = useGlobalAudio();

  // Автоматическая регистрация при загрузке приложения
  useEffect(() => {
    // Инициализация Telegram Mini App
    if (telegram.isMiniApp()) {
      telegram.init();
      console.log('Telegram Mini App initialized');

      // Получаем пользователя и логируем
      const user = telegram.getUser();
      if (user) {
        console.log('Telegram user:', user);

        // Автоматическая регистрация/вход
        dispatch(loginUser(user))
          .unwrap()
          .then((userData) => {
            console.log('✅ User logged in successfully:', userData);
          })
          .catch((error) => {
            console.error('❌ Auto-login failed:', error);
          });
      }
    } else {
      console.log('Running in browser mode');

      // В режиме разработки создаем тестового пользователя
      const testUser = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'ru'
      };

      dispatch(loginUser(testUser))
        .unwrap()
        .then((userData) => {
          console.log('✅ Test user logged in:', userData);
        })
        .catch((error) => {
          console.error('❌ Test login failed:', error);
        });
    }
  }, [dispatch]);

  useEffect(() => {
    if (currentPlaying) {
      setShowPlayer(true);
      // Открываем полный плеер только при смене нашида, но не при изменении состояния play/pause
      // Используем ID для отслеживания смены трека
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

  // Show onboarding if not completed
  if (showOnboarding) {
    return <OnboardingSlides onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/book/:id" element={<EnhancedBookReader />} />
        <Route path="/nashids" element={<Nashids />} />
        <Route path="/qibla" element={<Qibla />} />
        <Route path="/subscription" element={<Subscription />} />
      </Routes>
      <Navigation />

      {/* Глобальный аудиоплеер (только UI, аудио элемент управляется через useGlobalAudio) */}
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
    </div>
  );
}

function App() {
  useEffect(() => {
    // Скроллить к началу страницы при навигации
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
