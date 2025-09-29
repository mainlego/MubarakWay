import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserLocation, setLoading, setError } from '../store/slices/qiblaSlice';
import { Navigation, MapPin, Clock, Compass } from 'lucide-react';

const QiblaCompass = ({ direction, isAnimating = false }) => {
  const dispatch = useDispatch();
  const { qiblaDirection, userLocation, prayerTimes, loading, error } = useSelector(state => state.qibla);
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [magneticDeclination, setMagneticDeclination] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [orientationSupported, setOrientationSupported] = useState(false);

  // Фильтрация дрожания
  const [smoothedOrientation, setSmoothedOrientation] = useState(0);
  const orientationBuffer = useState([]).current;

  // Функция фильтрации дрожания
  const smoothOrientation = (newValue) => {
    // Обработка перехода через 360°/0°
    let adjustedValue = newValue;
    if (orientationBuffer.length > 0) {
      const lastValue = orientationBuffer[orientationBuffer.length - 1];
      const diff = newValue - lastValue;

      if (diff > 180) {
        adjustedValue = newValue - 360;
      } else if (diff < -180) {
        adjustedValue = newValue + 360;
      }
    }

    // Добавляем в буфер
    orientationBuffer.push(adjustedValue);

    // Ограничиваем размер буфера
    if (orientationBuffer.length > 5) {
      orientationBuffer.shift();
    }

    // Вычисляем среднее значение
    const average = orientationBuffer.reduce((sum, val) => sum + val, 0) / orientationBuffer.length;

    // Нормализуем к диапазону 0-360
    let normalized = average;
    while (normalized < 0) normalized += 360;
    while (normalized >= 360) normalized -= 360;

    return normalized;
  };

  // Запрос разрешений для iOS
  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          setOrientationSupported(true);
          return true;
        } else {
          setPermissionGranted(false);
          dispatch(setError('Необходимо разрешить доступ к компасу в настройках'));
          return false;
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        setPermissionGranted(false);
        dispatch(setError('Ошибка запроса разрешения компаса'));
        return false;
      }
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      // Старые версии iOS и Android
      setPermissionGranted(true);
      setOrientationSupported(true);
      return true;
    } else {
      setOrientationSupported(false);
      setPermissionGranted(false);
      return false;
    }
  };

  useEffect(() => {
    // Get user location
    dispatch(setLoading(true));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          dispatch(setLoading(false));
        },
        (error) => {
          dispatch(setError('Не удалось получить геолокацию'));
        }
      );
    } else {
      dispatch(setError('Геолокация не поддерживается'));
    }

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Проверяем поддержку ориентации
    const initOrientation = async () => {
      const hasPermission = await requestOrientationPermission();

      if (hasPermission) {
        const handleOrientation = (event) => {
          if (event.alpha !== null) {
            const rawAlpha = event.alpha;
            const smoothed = smoothOrientation(rawAlpha);
            setDeviceOrientation(smoothed);
            setSmoothedOrientation(smoothed);

            // Калибровка после получения нескольких значений
            if (orientationBuffer.length >= 3 && !isCalibrated) {
              setIsCalibrated(true);
            }
          }
        };

        window.addEventListener('deviceorientation', handleOrientation, { passive: true });

        return () => {
          window.removeEventListener('deviceorientation', handleOrientation);
        };
      }
    };

    const orientationCleanup = initOrientation();

    return () => {
      clearInterval(timeInterval);
      if (orientationCleanup && typeof orientationCleanup === 'function') {
        orientationCleanup();
      }
    };
  }, [dispatch]);

  const calculateQiblaDirection = () => {
    if (!userLocation) return 0;

    // Mecca coordinates (точные координаты Каабы)
    // Широта: 21°25'21" с. ш. = 21.4225°
    // Долгота: 39°49'34" в. д. = 39.8261°
    const meccaLat = 21.4225;
    const meccaLng = 39.8261;

    const { latitude: userLat, longitude: userLng } = userLocation;

    const latRad1 = (userLat * Math.PI) / 180;
    const latRad2 = (meccaLat * Math.PI) / 180;
    const deltaLng = ((meccaLng - userLng) * Math.PI) / 180;

    const bearing = Math.atan2(
      Math.sin(deltaLng) * Math.cos(latRad2),
      Math.cos(latRad1) * Math.sin(latRad2) - Math.sin(latRad1) * Math.cos(latRad2) * Math.cos(deltaLng)
    );

    return (bearing * 180) / Math.PI;
  };

  const qiblaDegree = direction || calculateQiblaDirection();

  // Normalize angles to 0-360 range
  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

  // Calculate adjusted angles for display (используем сглаженные значения)
  const northDirection = normalizeAngle(-smoothedOrientation);
  const qiblaDirectionAdjusted = normalizeAngle(qiblaDegree - smoothedOrientation);
  const deviceDirectionAdjusted = 0; // Device always points "up" in our view

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* iOS Permission Request */}
      {!orientationSupported && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-red-200 text-sm mb-2">Компас не поддерживается на этом устройстве</p>
          <p className="text-red-200 text-xs">Попробуйте использовать другой браузер или устройство</p>
        </div>
      )}

      {orientationSupported && !permissionGranted && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <p className="text-blue-200 text-sm mb-2">Для работы компаса нужно разрешение</p>
          <button
            onClick={requestOrientationPermission}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors touch-manipulation"
          >
            Разрешить доступ к компасу
          </button>
        </div>
      )}

      {/* Calibration Status */}
      {permissionGranted && !isCalibrated && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-200 text-sm">Поверните устройство восьмеркой для калибровки</p>
        </div>
      )}

      {/* Interactive Compass */}
      <div className="relative mx-auto mb-6" style={{ width: '320px', height: '320px' }}>

        {/* Outer Ring with Degrees */}
        <div
          className={`absolute inset-0 rounded-full border-4 border-white/30 compass-ring ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{
            transform: `rotate(${-smoothedOrientation}deg)`,
            background: 'conic-gradient(from 0deg, rgba(34, 197, 94, 0.1) 0deg, rgba(34, 197, 94, 0.2) 45deg, rgba(34, 197, 94, 0.1) 90deg, rgba(34, 197, 94, 0.05) 180deg, rgba(34, 197, 94, 0.1) 270deg, rgba(34, 197, 94, 0.2) 315deg, rgba(34, 197, 94, 0.1) 360deg)'
          }}
        >
          {/* Degree Markers */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = i * 10;
            const isCardinal = angle % 90 === 0;
            return (
              <div
                key={angle}
                className="absolute w-px bg-white/60"
                style={{
                  height: isCardinal ? '20px' : '12px',
                  left: '50%',
                  top: '2px',
                  transformOrigin: '50% 160px',
                  transform: `translateX(-50%) rotate(${angle}deg)`
                }}
              />
            );
          })}

          {/* Degree Numbers */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30;
            return (
              <div
                key={`deg-${angle}`}
                className="absolute text-white/80 text-xs font-mono"
                style={{
                  left: '50%',
                  top: '12px',
                  transformOrigin: '50% 148px',
                  transform: `translateX(-50%) rotate(${angle}deg) translateY(-50%)`
                }}
              >
                <span style={{ transform: `rotate(${-angle + smoothedOrientation}deg)`, display: 'inline-block' }}>
                  {angle === 0 ? '0°' : angle}
                </span>
              </div>
            );
          })}
        </div>

        {/* Inner Compass Face */}
        <div className="absolute inset-8 bg-black/20 backdrop-blur-sm rounded-full border-2 border-white/20">

          {/* Cardinal Directions */}
          <div className="absolute inset-4 rounded-full">
            {[
              { dir: 'N', angle: 0, color: 'text-red-400' },
              { dir: 'E', angle: 90, color: 'text-white' },
              { dir: 'S', angle: 180, color: 'text-white' },
              { dir: 'W', angle: 270, color: 'text-white' }
            ].map(({ dir, angle, color }) => (
              <div
                key={dir}
                className={`absolute ${color} font-bold text-xl`}
                style={{
                  left: '50%',
                  top: '8px',
                  transformOrigin: '50% 112px',
                  transform: `translateX(-50%) rotate(${angle - smoothedOrientation}deg)`
                }}
              >
                <span style={{ transform: `rotate(${-(angle - smoothedOrientation)}deg)`, display: 'inline-block' }} className="compass-smooth">
                  {dir}
                </span>
              </div>
            ))}
          </div>

          {/* Device Arrow (Red) */}
          <div
            className="absolute inset-0 flex items-center justify-center compass-arrow"
            style={{ transform: `rotate(${deviceDirectionAdjusted}deg)` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center mb-2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-white"></div>
              </div>
              <div className="w-1 bg-red-500/50 h-16"></div>
            </div>
          </div>

          {/* North Arrow (Blue) */}
          <div
            className="absolute inset-0 flex items-center justify-center compass-arrow"
            style={{ transform: `rotate(${northDirection}deg)` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 bg-blue-500 rounded-full border border-white flex items-center justify-center mb-1">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"></div>
              </div>
              <div className="w-px bg-blue-500/70 h-12"></div>
            </div>
          </div>

          {/* Qibla Arrow (Green) */}
          <div
            className={`absolute inset-0 flex items-center justify-center compass-arrow ${
              isAnimating ? 'animate-bounce' : ''
            }`}
            style={{ transform: `rotate(${qiblaDirectionAdjusted}deg)` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center mb-2 shadow-lg">
                <div className="text-white text-xs">🕋</div>
              </div>
              <div className="w-2 bg-green-500 h-20 rounded-full opacity-80"></div>
            </div>
          </div>
        </div>

        {/* Center Pivot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full -mt-1.5 -ml-1.5 border border-gray-400 z-10"></div>
      </div>

      {/* Compass Info */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-red-300 text-xs">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Устройство
          </div>
          <div className="text-white font-mono text-sm">0°</div>
        </div>
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-blue-300 text-xs">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Север
          </div>
          <div className="text-white font-mono text-sm">{Math.round(northDirection)}°</div>
        </div>
        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-green-300 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Мекка
          </div>
          <div className="text-white font-mono text-sm">{Math.round(qiblaDirectionAdjusted)}°</div>
        </div>
      </div>

      {/* Accuracy Info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <Compass className="w-4 h-4" />
          <span>Точность: ±{magneticDeclination ? '3' : '5'}°</span>
        </div>
        {userLocation && (
          <div className="text-white/60 text-xs mt-1">
            {userLocation.latitude.toFixed(4)}°, {userLocation.longitude.toFixed(4)}°
          </div>
        )}
      </div>
    </div>
  );
};

export default QiblaCompass;