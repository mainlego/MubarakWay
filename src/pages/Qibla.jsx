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
            { id: 'times', label: 'Время', icon: Clock },
            { id: 'stats', label: 'Статистика', icon: Settings }
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
                  <QiblaCompass
                    direction={qiblaDirection}
                    isAnimating={isAnimating}
                  />
                  <div className="text-center mt-4">
                    <p className="text-white/80 text-sm mb-2">
                      Поверните устройство для точного направления
                    </p>
                    <p className="text-white font-semibold">
                      Направление: {Math.round(qiblaDirection)}°
                    </p>
                    {isAnimating && (
                      <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <p className="text-green-300 text-sm animate-pulse">
                          ⏰ Приближается время молитвы
                        </p>
                      </div>
                    )}
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

              {/* Map Provider Selection */}
              <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1 mb-4">
                {[
                  { id: 'osm', label: 'Карта', desc: 'OpenStreetMap' },
                  { id: 'satellite', label: 'Спутник', desc: 'Спутниковый снимок' },
                  { id: 'terrain', label: 'Рельеф', desc: 'Топографическая' }
                ].map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setMapProvider(provider.id)}
                    className={`flex-1 py-2 px-2 rounded-md text-center transition-all ${
                      mapProvider === provider.id
                        ? 'bg-white text-gray-900'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-medium">{provider.label}</div>
                    <div className="text-xs opacity-80">{provider.desc}</div>
                  </button>
                ))}
              </div>

              {/* Interactive Map */}
              {userLocation ? (
                <div className="relative aspect-square bg-white/20 rounded-xl overflow-hidden mb-4">
                  {/* Map Tile Display */}
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: mapProvider === 'osm'
                        ? `url(https://tile.openstreetmap.org/10/${Math.floor((userLocation.longitude + 180) * 1024 / 360)}/${Math.floor((1 - Math.log(Math.tan(userLocation.latitude * Math.PI / 180) + 1 / Math.cos(userLocation.latitude * Math.PI / 180)) / Math.PI) * 512)}.png)`
                        : mapProvider === 'satellite'
                        ? `url(https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/${Math.floor((1 - Math.log(Math.tan(userLocation.latitude * Math.PI / 180) + 1 / Math.cos(userLocation.latitude * Math.PI / 180)) / Math.PI) * 512)}/${Math.floor((userLocation.longitude + 180) * 1024 / 360)})`
                        : `url(https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/10/${Math.floor((1 - Math.log(Math.tan(userLocation.latitude * Math.PI / 180) + 1 / Math.cos(userLocation.latitude * Math.PI / 180)) / Math.PI) * 512)}/${Math.floor((userLocation.longitude + 180) * 1024 / 360)})`
                    }}
                  >
                    {/* Map Overlay */}
                    <div className="absolute inset-0 bg-black/20">
                      {/* Location Marker */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-blue-500/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
                      </div>

                      {/* Qibla Direction Line */}
                      <div
                        className="absolute top-1/2 left-1/2 w-0.5 bg-green-500 origin-bottom transform -translate-x-1/2 -translate-y-full"
                        style={{
                          height: '120px',
                          transform: `translateX(-50%) translateY(-100%) rotate(${qiblaDirection || 0}deg)`
                        }}
                      >
                        {/* Direction Arrow */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-green-500"></div>
                        </div>
                      </div>

                      {/* Compass Rose */}
                      <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-red-400 font-bold text-xs">N</div>
                        </div>
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ transform: `rotate(${qiblaDirection || 0}deg)` }}
                        >
                          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-500 transform -translate-y-1"></div>
                        </div>
                      </div>

                      {/* Map Info */}
                      <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-white text-sm font-medium">
                          Направление на Мекку
                        </div>
                        <div className="text-white/80 text-xs">
                          {qiblaDirection ? `${Math.round(qiblaDirection)}° от севера` : 'Вычисляется...'}
                        </div>
                        <div className="text-white/60 text-xs mt-1">
                          Расстояние: ~{userLocation ? Math.round(
                            Math.sqrt(
                              Math.pow(userLocation.latitude - 21.4225, 2) +
                              Math.pow(userLocation.longitude - 39.8262, 2)
                            ) * 111
                          ) : 0} км
                        </div>
                      </div>
                    </div>
                  </div>
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

              {/* Map Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMapProvider(mapProvider === 'osm' ? 'satellite' : 'osm')}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Сменить слой
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                  onClick={() => window.open(
                    `https://www.openstreetmap.org/?mlat=${userLocation?.latitude}&mlon=${userLocation?.longitude}&zoom=15`,
                    '_blank'
                  )}
                  disabled={!userLocation}
                >
                  Полная карта
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
                {/* Today's Prayer Status */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3">Сегодня</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Фаджр', 'Зухр', 'Аср', 'Магриб', 'Иша'].map((prayer, index) => (
                      <div key={prayer} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <span className="text-white/80 text-sm">{prayer}</span>
                        <div className={`w-3 h-3 rounded-full ${
                          Math.random() > 0.5 ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Statistics */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3">Эта неделя</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Совершено молитв</span>
                      <span className="text-white font-bold">28/35</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '80%'}}></div>
                    </div>
                    <div className="text-center text-white/60 text-xs">80% выполнено</div>
                  </div>
                </div>

                {/* Monthly Chart */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3">Месячная активность</h3>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {Array.from({length: 28}, (_, i) => (
                      <div
                        key={i}
                        className={`h-6 rounded ${
                          Math.random() > 0.3
                            ? `bg-green-${Math.floor(Math.random() * 3) + 3}00`
                            : 'bg-gray-700'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Меньше</span>
                    <span>Больше</span>
                  </div>
                </div>

                {/* Streak Information */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3">Достижения</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">7</div>
                      <div className="text-xs text-white/80">Дней подряд</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">147</div>
                      <div className="text-xs text-white/80">Всего молитв</div>
                    </div>
                  </div>
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