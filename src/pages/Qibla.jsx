import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QiblaCompass from '../components/QiblaCompass';
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
  const [activeTab, setActiveTab] = useState('compass');
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
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
      setCurrentTime(new Date());
      dispatch(updateCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

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
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-6"
      style={backgroundStyle}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Кибла и намаз</h1>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <button
              onClick={handleRefreshPrayerTimes}
              disabled={prayerTimesLoading || !userLocation}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${prayerTimesLoading ? 'animate-spin' : ''}`} />
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

        {/* Tab Navigation */}
        <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1 mb-6">
          {[
            { id: 'compass', label: 'Компас', icon: Navigation },
            { id: 'map', label: 'Карта', icon: Map },
            { id: 'times', label: 'Время', icon: Clock }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          {activeTab === 'compass' && (
            <div>
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Интерактивный компас
              </h2>
              {qiblaDirection !== null ? (
                <>
                  <QiblaCompass direction={qiblaDirection} />
                  <div className="text-center mt-4">
                    <p className="text-white/80 text-sm mb-2">
                      Поверните устройство для точного направления
                    </p>
                    <p className="text-white font-semibold">
                      Направление: {Math.round(qiblaDirection)}°
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Navigation className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <p className="text-white/80">Определение местоположения...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div>
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Карта направления
              </h2>
              <div className="aspect-square bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <Map className="w-12 h-12 mx-auto mb-2 opacity-60" />
                  <p className="text-sm">Интеграция с картографическим сервисом</p>
                  <p className="text-xs opacity-80 mt-1">Отображение окружающих объектов</p>
                </div>
              </div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                Переключить провайдер карт
              </button>
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
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-white/60 text-xs space-y-2">
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
      </div>
    </div>
  );
};

export default Qibla;