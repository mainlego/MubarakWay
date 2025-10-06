import React, { useEffect, useState, useRef } from 'react';
import { getQiblaDirection } from '@masaajid/qibla';
import { Navigation, Compass, MapPin, RefreshCw } from 'lucide-react';

const QiblaCompass = () => {
  // ========== СОСТОЯНИЯ ==========
  const [qiblaData, setQiblaData] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0); // Курс устройства
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [accuracy, setAccuracy] = useState(null); // Точность компаса
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const [isPointingToQibla, setIsPointingToQibla] = useState(false);

  // ========== REFS ==========
  const smoothHeadingRef = useRef(0); // Для плавной анимации
  const animationFrameRef = useRef(null);
  const headingHistoryRef = useRef([]); // История для сглаживания
  const lastUpdateTimeRef = useRef(0); // Для throttling на iOS

  // ========== ОПРЕДЕЛЕНИЕ iOS ==========
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
    console.log('Platform:', ios ? 'iOS' : 'Android/Other');
  }, []);

  // ========== ПОЛУЧЕНИЕ ГЕОЛОКАЦИИ ==========
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим устройством');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(location);

        // Расчет направления на Киблу
        try {
          const result = getQiblaDirection(location, {
            bearingPrecision: 2,
            distancePrecision: 0,
            includeCardinalDirection: true,
            includeMagneticDeclination: true // Включаем магнитное склонение для точности
          });

          console.log('Qibla direction calculated:', result);
          setQiblaData(result);
          setLoading(false);
        } catch (err) {
          console.error('Qibla calculation error:', err);
          setError('Ошибка расчета направления на Киблу');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Не удалось получить ваше местоположение');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, []);

  // ========== ЗАПРОС РАЗРЕШЕНИЯ (iOS 13+) ==========
  const requestOrientationPermission = async () => {
    if (!isIOS) {
      setPermissionGranted(true);
      startCompass();
      return;
    }

    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          startCompass();
        } else {
          setError('Доступ к компасу отклонен. Разрешите доступ в настройках Safari.');
        }
      } else {
        setPermissionGranted(true);
        startCompass();
      }
    } catch (err) {
      console.error('Permission error:', err);
      setError('Ошибка запроса доступа к компасу');
    }
  };

  // ========== СГЛАЖИВАНИЕ ЗНАЧЕНИЙ (Moving Average) ==========
  const smoothHeading = (newHeading) => {
    const history = headingHistoryRef.current;
    history.push(newHeading);

    // Уменьшено количество значений для более быстрого отклика
    const maxHistory = isIOS ? 3 : 2;
    if (history.length > maxHistory) {
      history.shift();
    }

    // Обработка перехода через 360/0
    let adjusted = [...history];
    const first = adjusted[0];
    adjusted = adjusted.map(h => {
      const diff = h - first;
      if (diff > 180) return h - 360;
      if (diff < -180) return h + 360;
      return h;
    });

    // Среднее значение
    const avg = adjusted.reduce((a, b) => a + b, 0) / adjusted.length;

    // Нормализация 0-360
    return (avg + 360) % 360;
  };

  // ========== ОБРАБОТКА ОРИЕНТАЦИИ УСТРОЙСТВА ==========
  const handleOrientation = (event) => {
    let heading = 0;

    // iOS: используем webkitCompassHeading (уже с магнитным склонением)
    if (event.webkitCompassHeading !== undefined) {
      heading = event.webkitCompassHeading;
    }
    // Android/другие: используем alpha напрямую
    else if (event.alpha !== null) {
      heading = event.alpha;
    } else {
      console.warn('No compass data available');
      return;
    }

    // Точность (доступна только на некоторых устройствах)
    if (event.webkitCompassAccuracy !== undefined) {
      setAccuracy(event.webkitCompassAccuracy);
      // Если точность низкая (> 20 градусов), нужна калибровка
      if (event.webkitCompassAccuracy > 20 || event.webkitCompassAccuracy < 0) {
        setNeedsCalibration(true);
      } else {
        setNeedsCalibration(false);
      }
    }

    // Сглаживание для плавности
    const smoothed = smoothHeading(heading);

    // Используем requestAnimationFrame для плавной анимации
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      // Интерполяция для плавного движения без рывков
      const current = smoothHeadingRef.current;
      let diff = smoothed - current;

      // Выбираем кратчайший путь через 360/0
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      // Более быстрая интерполяция для лучшего отклика
      const lerpFactor = isIOS ? 0.4 : 0.5;
      const newHeading = current + diff * lerpFactor;
      smoothHeadingRef.current = (newHeading + 360) % 360;

      // Обновляем состояние чаще для более плавной анимации
      // Правильная проверка разницы с учётом перехода через 0°/360°
      let headingDiff = Math.abs(smoothHeadingRef.current - deviceHeading);
      if (headingDiff > 180) headingDiff = 360 - headingDiff;

      if (headingDiff > 0.1) {
        setDeviceHeading(smoothHeadingRef.current);
      }

      // Проверка направления на Киблу (±10 градусов)
      if (qiblaData) {
        const qiblaDiff = Math.abs(qiblaData.bearing - smoothHeadingRef.current);
        const normalizedDiff = qiblaDiff > 180 ? 360 - qiblaDiff : qiblaDiff;
        setIsPointingToQibla(normalizedDiff <= 10);
      }
    });
  };

  // ========== ЗАПУСК КОМПАСА ==========
  const startCompass = () => {
    if (isIOS) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      // Android: пробуем deviceorientationabsolute (абсолютная ориентация)
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    }
    console.log('Compass started');
  };

  // ========== КАЛИБРОВКА ==========
  const handleCalibration = () => {
    setNeedsCalibration(false);
    headingHistoryRef.current = [];
    smoothHeadingRef.current = 0;
  };

  // ========== CLEANUP ==========
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ========== РАСЧЕТ ОТНОСИТЕЛЬНОГО УГЛА ==========
  const getRelativeQiblaAngle = () => {
    if (!qiblaData) return 0;
    // Угол Киблы относительно севера минус курс устройства
    return (qiblaData.bearing - deviceHeading + 360) % 360;
  };

  const relativeQiblaAngle = getRelativeQiblaAngle();

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <Compass className="w-16 h-16 text-emerald-400 animate-spin mb-4" />
        <p className="text-white/70 text-center">Определение вашего местоположения...</p>
      </div>
    );
  }

  // ========== ERROR STATE ==========
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md">
          <p className="text-red-400 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 px-4 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // ========== PERMISSION REQUEST STATE ==========
  if (!permissionGranted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 max-w-md">
          <Compass className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 text-center">Доступ к компасу</h3>
          <p className="text-white/70 text-center mb-6">
            Для определения направления на Киблу необходим доступ к компасу вашего устройства
          </p>
          <button
            onClick={requestOrientationPermission}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Включить компас
          </button>
        </div>
      </div>
    );
  }

  // ========== ГЛАВНЫЙ ИНТЕРФЕЙС ==========
  const distanceKm = qiblaData?.distance ? Math.round(qiblaData.distance / 1000) : '—';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 relative">
      {/* Уведомление о направлении на Киблу - ФИКСИРОВАННОЕ */}
      {isPointingToQibla && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur-md border border-emerald-400 rounded-xl p-3 px-6 shadow-lg animate-pulse max-w-xs w-auto">
          <p className="text-white text-sm text-center font-semibold flex items-center justify-center gap-2">
            <Navigation className="w-5 h-5" />
            Вы направлены на Киблу!
          </p>
        </div>
      )}

      {/* Предупреждение о калибровке */}
      {needsCalibration && (
        <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 max-w-md">
          <p className="text-yellow-300 text-sm text-center mb-2">
            Низкая точность компаса. Выполните калибровку:
          </p>
          <p className="text-yellow-200/80 text-xs text-center mb-3">
            Поверните устройство восьмеркой в воздухе
          </p>
          <button
            onClick={handleCalibration}
            className="w-full bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-200 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Сбросить калибровку
          </button>
        </div>
      )}

      {/* Информация о местоположении */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-1">
          <MapPin className="w-4 h-4" />
          <span>{userLocation?.latitude.toFixed(4)}°, {userLocation?.longitude.toFixed(4)}°</span>
        </div>
        <p className="text-white/70 text-sm">
          {qiblaData?.cardinalDirection} • {qiblaData?.bearing.toFixed(1)}° • {distanceKm} км до Мекки
        </p>
        {accuracy !== null && (
          <p className="text-white/50 text-xs mt-1">
            Точность: ±{Math.abs(accuracy).toFixed(0)}°
          </p>
        )}
      </div>

      {/* ========== КОМПАС ========== */}
      <div className="relative w-80 h-80 mb-6">
        {/* Подвижное кольцо с градусами (вращается от курса устройства) */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-4 border-emerald-500/30 shadow-2xl"
          style={{
            transform: `rotate(${-deviceHeading}deg)`,
            willChange: 'transform', // Оптимизация для GPU
          }}
        >
          {/* Градусные метки */}
          {[...Array(36)].map((_, i) => {
            const angle = i * 10;
            const isMajor = angle % 30 === 0;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-0 origin-bottom -translate-x-1/2"
                style={{
                  height: '50%',
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div className={`mx-auto ${isMajor ? 'w-0.5 h-6 bg-white/80' : 'w-0.5 h-3 bg-white/40'}`} />
                {angle % 90 === 0 && (
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-bold text-sm"
                    style={{ transform: `rotate(${-angle}deg)` }}
                  >
                    {angle === 0 ? 'N' : angle === 90 ? 'E' : angle === 180 ? 'S' : 'W'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Стрелка СЕВЕР (всегда вверху кольца) */}
          <div className="absolute left-1/2 top-0 origin-bottom -translate-x-1/2 pt-2">
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[20px] border-b-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
              <div className="mt-1 text-blue-300 text-xs font-bold">N</div>
            </div>
          </div>

          {/* Стрелка МЕККА (относительно севера) */}
          <div
            className="absolute left-1/2 top-0 origin-bottom -translate-x-1/2"
            style={{
              height: '50%',
              transform: `rotate(${qiblaData?.bearing || 0}deg)`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[28px] transition-all duration-300 ${
                isPointingToQibla
                  ? 'border-b-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                  : 'border-b-emerald-500 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]'
              }`} />
              <div className={`mt-1 text-xs font-bold transition-colors duration-300 ${
                isPointingToQibla ? 'text-emerald-300' : 'text-emerald-400'
              }`}>🕋</div>
            </div>
          </div>
        </div>

        {/* Статичная стрелка устройства (красная, всегда вверху) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-4 pointer-events-none z-10">
          <div className="flex flex-col items-center">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[32px] border-b-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
            <div className="mt-2 text-red-400 text-xs font-bold bg-slate-900/70 px-2 py-1 rounded">ВЫ</div>
          </div>
        </div>

        {/* Центральная точка */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-slate-700 z-20" />
      </div>

      {/* ========== ИНДИКАТОРЫ ========== */}
      <div className="w-full max-w-md space-y-3">
        {/* Направление на Киблу */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-emerald-500/30">
          <p className="text-white/50 text-xs mb-1">Направление на Киблу</p>
          <p className="text-3xl font-bold text-emerald-400">
            {qiblaData?.bearing.toFixed(0)}°
          </p>
          <p className="text-white/50 text-xs mt-1">{qiblaData?.cardinalDirection}</p>
        </div>

        {/* Курс устройства */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-blue-500/30">
          <p className="text-white/50 text-xs mb-1">Ваш курс</p>
          <p className="text-2xl font-bold text-blue-400">
            {deviceHeading.toFixed(0)}°
          </p>
        </div>

        {/* Относительный угол */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-yellow-500/30">
          <p className="text-white/50 text-xs mb-1">Поверните на</p>
          <p className="text-2xl font-bold text-yellow-400">
            {relativeQiblaAngle <= 180
              ? `${relativeQiblaAngle.toFixed(0)}° вправо ↻`
              : `${(360 - relativeQiblaAngle).toFixed(0)}° влево ↺`
            }
          </p>
        </div>
      </div>

      {/* Легенда */}
      <div className="mt-6 bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 w-full max-w-md">
        <p className="text-white/70 text-xs text-center mb-2 font-semibold">Обозначения:</p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-red-500" />
            <span className="text-white/70">Ваше устройство (статичное)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-blue-400" />
            <span className="text-white/70">Север (вращается с компасом)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-emerald-500" />
            <span className="text-white/70">Направление на Мекку 🕋</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QiblaCompass;
