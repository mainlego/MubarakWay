import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QiblaCompass from '../components/QiblaCompass';
import QiblaMap from '../components/QiblaMap';
import { Navigation, Map, Clock, Settings, MapPin, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getBackgroundWithOverlay } from '../utils/backgrounds';
import {
  getCurrentLocation,
  calculatePrayerTimes,
  loadPrayerSettings,
  updateCurrentTime
} from '../store/slices/qiblaSlice';
import prayerTimesService from '../services/prayerTimesService';
import { useOffline } from '../hooks/useOffline';

const Qibla = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('times');
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastPrayerCheck, setLastPrayerCheck] = useState(null);
  const [mapProvider, setMapProvider] = useState('osm'); // osm, satellite, terrain
  const { isOnline } = useOffline();

  const {
    userLocation,
    locationLoading,
    locationError,
    prayerTimes,
    prayerTimesLoading,
    prayerTimesError,
    currentPrayer,
    nextPrayer,
    timeUntilNext,
    qiblaDirection,
    settings,
    notificationsEnabled
  } = useSelector(state => state.qibla);

  useEffect(() => {
    setBackgroundStyle(getBackgroundWithOverlay('qibla', 0.4));
    dispatch(loadPrayerSettings());
  }, [dispatch]);

  useEffect(() => {
    // Обновляем время каждую секунду
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      dispatch(updateCurrentTime());

      // Проверяем наступление времени молитвы для анимации
      if (prayerTimes && nextPrayer) {
        const prayerTime = new Date(nextPrayer.time);
        const timeDiff = Math.abs(now - prayerTime);

        // Анимация за 5 минут до и в течение 2 минут после времени молитвы
        if (timeDiff <= 5 * 60 * 1000) {
          if (!isAnimating) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 7 * 60 * 1000); // 7 минут анимации
          }
        } else {
          setIsAnimating(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch, prayerTimes, nextPrayer, isAnimating]);

  useEffect(() => {
    // Получаем местоположение при загрузке
    if (!userLocation && !locationLoading) {
      handleGetLocation();
    }
  }, [userLocation, locationLoading]);

  useEffect(() => {
    // Рассчитываем время молитв при получении местоположения
    if (userLocation && settings && (!prayerTimes || isPrayerTimesOutdated())) {
      dispatch(calculatePrayerTimes({
        date: new Date(),
        location: userLocation,
        settings
      }));
    }
  }, [userLocation, settings, dispatch]);

  const handleGetLocation = () => {
    dispatch(getCurrentLocation());
  };

  const handleRefreshPrayerTimes = () => {
    if (userLocation && settings) {
      dispatch(calculatePrayerTimes({
        date: new Date(),
        location: userLocation,
        settings
      }));
    }
  };

  const isPrayerTimesOutdated = () => {
    if (!prayerTimes || !prayerTimes.date) return true;
    const today = new Date().toDateString();
    const timesDate = new Date(prayerTimes.date).toDateString();
    return today !== timesDate;
  };

  const formatTime = (date) => {
    return prayerTimesService.formatTime(date);
  };

  const prayers = prayerTimes ? [
    { name: 'Фаджр', time: prayerTimes.fajr, key: 'fajr' },
    { name: 'Восход', time: prayerTimes.sunrise, key: 'sunrise' },
    { name: 'Зухр', time: prayerTimes.dhuhr, key: 'dhuhr' },
    { name: 'Аср', time: prayerTimes.asr, key: 'asr' },
    { name: 'Магриб', time: prayerTimes.maghrib, key: 'maghrib' },
    { name: 'Иша', time: prayerTimes.isha, key: 'isha' },
  ] : [];

  return (
    <div className="min-h-screen p-4 sm:p-6 overflow-x-hidden relative bg-gradient-to-br from-amber-950 via-orange-900 to-yellow-900">
      {/* Compass rose and prayer time pattern */}
      <style>{`
        @keyframes compassRose {
          0%, 100% { opacity: 0.08; transform: rotate(0deg) scale(1); }
          50% { opacity: 0.15; transform: rotate(5deg) scale(1.02); }
        }
        @keyframes rayRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes prayerBlink {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.08; }
        }
        .qibla-pattern {
          background-image:
            radial-gradient(circle at center, transparent 40%, rgba(251,191,36,.05) 40%, rgba(251,191,36,.05) 42%, transparent 42%),
            repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(245,158,11,.04) 15deg, transparent 30deg);
          animation: compassRose 12s ease-in-out infinite;
        }
      `}</style>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 qibla-pattern pointer-events-none"></div>

      {/* Rotating compass rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ animation: 'rayRotate 60s linear infinite' }}>
        <div className="absolute top-1/2 left-1/2 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent transform -translate-y-1/2 rotate-45"></div>
        <div className="absolute top-1/2 left-1/2 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transform -translate-y-1/2 rotate-90"></div>
        <div className="absolute top-1/2 left-1/2 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent transform -translate-y-1/2 rotate-[135deg]"></div>
      </div>

      {/* Soft glowing orbs */}
      <div className="absolute top-24 -right-20 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl" style={{ animation: 'prayerBlink 6s ease-in-out infinite' }}></div>
      <div className="absolute bottom-24 -left-20 w-72 h-72 bg-orange-500/8 rounded-full blur-3xl" style={{ animation: 'prayerBlink 8s ease-in-out infinite', animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/6 rounded-full blur-3xl" style={{ animation: 'prayerBlink 10s ease-in-out infinite', animationDelay: '4s' }}></div>

      <div className="max-w-md mx-auto w-full relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Намаз-ассистент</h1>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            )}
            <button
              onClick={handleRefreshPrayerTimes}
              disabled={prayerTimesLoading || !userLocation}
              className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white active:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${prayerTimesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-200 text-sm text-center">{locationError}</p>
            <button
              onClick={handleGetLocation}
              className="w-full mt-2 py-2 bg-red-500/30 rounded-lg text-white text-sm hover:bg-red-500/40 transition-colors"
            >
              Повторить попытку
            </button>
          </div>
        )}

        {!userLocation && !locationLoading && !locationError && (
          <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-300" />
              <div className="flex-1">
                <p className="text-blue-200 text-sm">Разрешите доступ к геолокации</p>
                <p className="text-blue-300 text-xs">Для точного расчета времени молитв</p>
              </div>
              <button
                onClick={handleGetLocation}
                className="px-3 py-1 bg-blue-500/30 rounded-lg text-blue-200 text-sm hover:bg-blue-500/40 transition-colors"
              >
                Разрешить
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation - Mobile Scrollable */}
        <div className="mb-4 sm:mb-6 w-full">
          <div className="overflow-x-auto scrollbar-hide mobile-tabs smooth-scroll">
            <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1 gap-1 min-w-max">
              {[
                { id: 'times', label: 'Время', icon: Clock },
                { id: 'compass', label: 'Кибла', icon: Navigation },
                { id: 'map', label: 'Карта', icon: Map },
                { id: 'stats', label: 'Статистика', icon: Settings }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all whitespace-nowrap touch-manipulation ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-md'
                        : 'text-white active:bg-white/20'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Indicators */}
          <div className="flex justify-center mt-2 gap-1">
            {[
              { id: 'times' },
              { id: 'compass' },
              { id: 'map' },
              { id: 'stats' }
            ].map((tab) => (
              <div
                key={tab.id}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                  activeTab === tab.id ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 w-full">
          {activeTab === 'compass' && (
            <div className="w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-3 sm:mb-4">
                Интерактивный компас
              </h2>
              {locationLoading ? (
                <div className="text-center py-12">
                  <Navigation className="w-16 h-16 text-white/50 mx-auto mb-4 animate-pulse" />
                  <p className="text-white/80">Определение местоположения...</p>
                </div>
              ) : locationError ? (
                <div className="text-center py-12">
                  <Navigation className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
                  <p className="text-red-300 mb-4">{locationError}</p>
                  <button
                    onClick={handleGetLocation}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : (
                <>
                  <QiblaCompass
                    direction={qiblaDirection || 0}
                    isAnimating={isAnimating}
                  />
                  <div className="text-center mt-4">
                    <p className="text-white/80 text-sm mb-2">
                      Поверните устройство для точного направления
                    </p>
                    <p className="text-white font-semibold">
                      Направление: {qiblaDirection && !isNaN(qiblaDirection) ? Math.round(qiblaDirection) : 'Вычисляется...'}
                    </p>
                    {userLocation && (
                      <p className="text-white/60 text-xs mt-2">
                        {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </p>
                    )}
                    {isAnimating && (
                      <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <p className="text-green-300 text-sm animate-pulse">
                          ⏰ Приближается время молитвы
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-3 sm:mb-4">
                Интерактивная карта
              </h2>

              {/* Interactive Map */}
              {userLocation ? (
                <div className="relative bg-white/10 rounded-xl overflow-hidden mb-4" style={{ height: '400px' }}>
                  <QiblaMap
                    userLocation={userLocation}
                    qiblaDirection={qiblaDirection}
                  />
                </div>
              ) : (
                <div className="aspect-square bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-center text-white">
                    <Map className="w-12 h-12 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">Ожидание геолокации</p>
                    <p className="text-xs opacity-80 mt-1">Для отображения карты нужно разрешить доступ к местоположению</p>
                  </div>
                </div>
              )}

              {/* Map Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4">
                <h3 className="text-white font-medium mb-2 text-sm sm:text-base">О маршруте</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-white/80">
                    <span>🧭 Направление:</span>
                    <span className="font-medium text-white">
                      {qiblaDirection ? `${Math.round(qiblaDirection)}° от севера` : 'Вычисляется...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>📏 Расстояние:</span>
                    <span className="font-medium text-white">
                      {userLocation ? (() => {
                        const R = 6371;
                        const lat1 = userLocation.latitude * Math.PI / 180;
                        const lat2 = 21.4225 * Math.PI / 180;
                        const deltaLat = (21.4225 - userLocation.latitude) * Math.PI / 180;
                        const deltaLng = (39.8261 - userLocation.longitude) * Math.PI / 180;
                        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                                  Math.cos(lat1) * Math.cos(lat2) *
                                  Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        return `${Math.round(R * c).toLocaleString('ru-RU')} км`;
                      })() : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>🕋 Кааба:</span>
                    <span className="font-medium text-white">21.4225°N, 39.8261°E</span>
                  </div>
                </div>
              </div>

              {/* Map Instructions */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 mb-4">
                <div className="text-blue-200 text-xs sm:text-sm">
                  <p className="font-medium mb-1">💡 Как пользоваться:</p>
                  <ul className="space-y-1 list-disc list-inside text-blue-300">
                    <li>Синяя точка — ваше местоположение</li>
                    <li>🕋 — Кааба в Мекке</li>
                    <li>Зеленая пунктирная линия — маршрут</li>
                    <li>Стрелки показывают направление</li>
                    <li>Используйте жесты для масштабирования</li>
                  </ul>
                </div>
              </div>

              {/* Map Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  className="bg-blue-600 active:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {locationLoading ? 'Обновление...' : '🔄 Обновить'}
                </button>
                <button
                  className="bg-green-600 active:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                  onClick={() => window.open(
                    `https://www.google.com/maps/dir/${userLocation?.latitude},${userLocation?.longitude}/21.4225,39.8261`,
                    '_blank'
                  )}
                  disabled={!userLocation}
                >
                  📍 Google Maps
                </button>
              </div>
            </div>
          )}

          {activeTab === 'times' && (
            <div>
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Время молитв
              </h2>

              {prayerTimesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/80">Расчет времени молитв...</p>
                </div>
              ) : prayerTimesError ? (
                <div className="text-center py-8">
                  <p className="text-red-300 mb-4">{prayerTimesError}</p>
                  <button
                    onClick={handleRefreshPrayerTimes}
                    className="px-4 py-2 bg-red-500/30 rounded-lg text-white hover:bg-red-500/40 transition-colors"
                  >
                    Повторить
                  </button>
                </div>
              ) : prayers.length > 0 ? (
                <>
                  {/* Current Time */}
                  <div className="text-center mb-4">
                    <p className="text-white/80 text-sm">Текущее время</p>
                    <p className="text-white text-xl font-bold">
                      {currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Prayer Times List */}
                  <div className="space-y-3 mb-6">
                    {prayers.map((prayer) => {
                      const isNext = nextPrayer && nextPrayer.name === prayer.key;
                      return (
                        <div
                          key={prayer.name}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isNext
                              ? 'bg-green-600/30 border border-green-500/50'
                              : 'bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="text-white font-medium">{prayer.name}</div>
                            {isNext && (
                              <div className="text-green-300 text-xs">Следующая молитва</div>
                            )}
                          </div>
                          <div className="text-white font-mono text-lg">
                            {formatTime(prayer.time)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Next Prayer Countdown */}
                  {timeUntilNext && (
                    <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                      <div className="text-green-300 text-sm mb-1">
                        До {timeUntilNext.prayer.displayName}
                      </div>
                      <div className="text-white text-2xl font-bold">
                        {timeUntilNext.formatted}
                      </div>
                      {prayerTimes.isOffline && (
                        <div className="text-yellow-300 text-xs mt-2">
                          Офлайн данные
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <p className="text-white/80">Нет данных о времени молитв</p>
                </div>
              )}

              {/* Settings */}
              <button className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Настройки расчета</span>
              </button>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-xl font-semibold text-white text-center mb-6">
                Статистика молитв
              </h2>

              {/* Prayer Statistics */}
              <div className="space-y-4 mb-6">
                {/* Info Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-white font-medium mb-2">Статистика в разработке</h3>
                  <p className="text-white/70 text-sm">
                    Функция отслеживания молитв и достижений скоро будет доступна.
                  </p>
                </div>

                {/* Accuracy Settings */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3">Допуски направления</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Точность компаса</span>
                      <select className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm">
                        <option value="strict">Строгая (±2°)</option>
                        <option value="normal">Обычная (±5°)</option>
                        <option value="lenient">Мягкая (±10°)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Учитывать магнитное склонение</span>
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="rounded bg-white/10 border-white/20" defaultChecked />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-white/60 text-xs space-y-2 mb-20">
          {userLocation ? (
            <>
              <p>Расчет основан на вашем местоположении</p>
              <p>
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </p>
              {settings && (
                <p>Метод: {settings.calculationMethod}</p>
              )}
            </>
          ) : (
            <p>Разрешите доступ к геолокации для точных расчетов</p>
          )}
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default Qibla;