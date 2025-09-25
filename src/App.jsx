import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { telegram } from './utils/telegram';

import Home from './pages/Home';
import Library from './pages/Library';
import Nashids from './pages/Nashids';
import Qibla from './pages/Qibla';
import Navigation from './components/Navigation';

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
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/nashids" element={<Nashids />} />
            <Route path="/qibla" element={<Qibla />} />
          </Routes>
          <Navigation />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
