import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';
import { telegram } from './utils/telegram';

import Home from './pages/Home';
import Library from './pages/Library';
import Nashids from './pages/Nashids';
import Qibla from './pages/Qibla';
import EnhancedBookReader from './components/EnhancedBookReader';
import Navigation from './components/Navigation';
import AudioPlayer from './components/AudioPlayer';
import ScrollToTop from './components/ScrollToTop';

function AppContent() {
  const { currentPlaying, nashids } = useSelector(state => state.nashids);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);

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
    setIsPlayerMinimized(!isPlayerMinimized);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/book/:id" element={<EnhancedBookReader />} />
        <Route path="/nashids" element={<Nashids />} />
        <Route path="/qibla" element={<Qibla />} />
      </Routes>
      <Navigation />

      {/* Глобальный аудиоплеер */}
      {showPlayer && currentPlaying && (
        <AudioPlayer
          nashid={currentPlaying}
          playlist={nashids}
          onClose={handleClosePlayer}
          isMinimized={isPlayerMinimized}
          onToggleMinimize={handleToggleMinimize}
        />
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    // Инициализация Telegram Mini App
    if (telegram.isMiniApp()) {
      telegram.init();
      console.log('Telegram Mini App initialized');

      // Получаем пользователя и логируем
      const user = telegram.getUser();
      if (user) {
        console.log('Telegram user:', user);
      }
    } else {
      console.log('Running in browser mode');
    }

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
