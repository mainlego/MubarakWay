import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Music, Navigation2, Clock, Crown } from 'lucide-react';
import { getBackgroundWithOverlay } from '../utils/backgrounds';
import prayerTimesService from '../services/prayerTimesService';

const Home = () => {
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [nextPrayer, setNextPrayer] = useState(null);
  const [timeUntilPrayer, setTimeUntilPrayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBackgroundStyle(getBackgroundWithOverlay('home', 0.3));
    loadPrayerTimes();

    // Обновляем время каждую минуту
    const interval = setInterval(() => {
      updateTimeUntilPrayer();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadPrayerTimes = async () => {
    try {
      setLoading(true);
      // Получаем местоположение
      const location = await prayerTimesService.getCurrentLocation();

      // Загружаем настройки
      await prayerTimesService.loadSettings();

      // Рассчитываем время молитв
      const times = await prayerTimesService.getPrayerTimesWithOfflineSupport(
        new Date(),
        location
      );

      // Получаем следующую молитву
      const next = prayerTimesService.getNextPrayer(times);
      setNextPrayer(next);

      updateTimeUntilPrayer(times);
    } catch (error) {
      console.error('Error loading prayer times:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeUntilPrayer = (times = null) => {
    const timeInfo = prayerTimesService.getTimeUntilNextPrayer(times);
    setTimeUntilPrayer(timeInfo);
  };

  const features = [
    {
      title: 'Библиотека книг',
      description: 'Исламская литература с встроенной читалкой',
      icon: BookOpen,
      link: '/library',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Нашиды',
      description: 'Религиозные песнопения и плейлисты',
      icon: Music,
      link: '/nashids',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Направление киблы',
      description: 'Компас и время молитв',
      icon: Navigation2,
      link: '/qibla',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-6 overflow-x-hidden"
      style={backgroundStyle}
    >
      <div className="max-w-md mx-auto pt-4 sm:pt-8 w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">MubarakWay</h1>
          <p className="text-gray-100 text-base sm:text-lg drop-shadow">Ваш путь к исламскому знанию</p>
        </div>

        {/* Time Widget */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-center shadow-lg w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-sm sm:text-base text-gray-700 font-medium">Следующая молитва</span>
          </div>
          {loading ? (
            <div className="text-sm sm:text-base text-gray-500">Загрузка...</div>
          ) : nextPrayer && timeUntilPrayer ? (
            <>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                {nextPrayer.displayName}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                через {timeUntilPrayer.formatted}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {prayerTimesService.formatTime(nextPrayer.time)}
              </div>
            </>
          ) : (
            <div className="text-sm sm:text-base text-gray-500">Нет данных</div>
          )}
        </div>

        {/* Features Grid */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 w-full">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.link}
                className="block w-full"
              >
                <div className={`bg-gradient-to-r ${feature.gradient} rounded-2xl p-4 sm:p-6 text-white transition-transform active:scale-95 sm:hover:scale-105 w-full`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-white/20 rounded-xl flex-shrink-0">
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold mb-1 truncate">{feature.title}</h3>
                      <p className="text-white/90 text-xs sm:text-sm line-clamp-2">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Daily Quote */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg w-full">
          <h3 className="text-base sm:text-lg text-gray-800 font-semibold mb-2 sm:mb-3">Хадис дня</h3>
          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3">
            "Поистине, Аллах не изменит положения людей, пока они не изменят самих себя."
          </p>
          <p className="text-gray-500 text-xs">Коран 13:11</p>
        </div>

        {/* Subscription Banner */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-4 sm:p-6 text-center w-full mb-20">
          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white mx-auto mb-2 sm:mb-3" />
          <h3 className="text-base sm:text-lg text-white font-semibold mb-2">Откройте больше возможностей</h3>
          <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-4">
            200+ книг, эксклюзивные лекции и персональные уроки
          </p>
          <button className="bg-white text-yellow-600 px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-medium active:bg-yellow-50 transition-colors w-full sm:w-auto">
            Оформить подписку
          </button>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default Home;