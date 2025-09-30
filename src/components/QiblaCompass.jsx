import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserLocation, setLoading, setError } from '../store/slices/qiblaSlice';
import { Navigation, MapPin, Clock, Compass } from 'lucide-react';
import GyroNorm from 'gyronorm';
import {
  MECCA_COORDINATES,
  COMPASS_SMOOTHING_BUFFER_SIZE,
  COMPASS_SENSITIVITY,
  GYRO_UPDATE_FREQUENCY,
  COMPASS_FALLBACK_TIMEOUT
} from '../constants/qibla';

const QiblaCompass = ({ direction, isAnimating = false }) => {
  const dispatch = useDispatch();
  const { qiblaDirection, userLocation, prayerTimes, locationLoading, error } = useSelector(state => state.qibla);
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [magneticDeclination, setMagneticDeclination] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [orientationSupported, setOrientationSupported] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualOrientation, setManualOrientation] = useState(0);
  const [sensitivity, setSensitivity] = useState(COMPASS_SENSITIVITY);

  // Фильтрация дрожания
  const [smoothedOrientation, setSmoothedOrientation] = useState(0);
  const [orientationBuffer, setOrientationBuffer] = useState([]);

  // Улучшенная функция сглаживания с буфером
  const smoothOrientation = (newValue) => {
    if (typeof newValue !== 'number' || isNaN(newValue)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid orientation value:', newValue);
      }
      return smoothedOrientation;
    }

    // Нормализуем к диапазону 0-360
    let normalized = newValue;
    while (normalized < 0) normalized += 360;
    while (normalized >= 360) normalized -= 360;

    setOrientationBuffer(currentBuffer => {
      const buffer = [...currentBuffer];

      // Обработка перехода через 360°/0°
      let adjustedValue = normalized;
      if (buffer.length > 0) {
        const lastValue = buffer[buffer.length - 1];
        const diff = normalized - lastValue;

        // Если разница больше 180°, значит мы пересекли 0°/360°
        if (diff > 180) {
          adjustedValue = normalized - 360;
        } else if (diff < -180) {
          adjustedValue = normalized + 360;
        }
      }

      // Добавляем в буфер с ограничением размера
      buffer.push(adjustedValue);
      if (buffer.length > COMPASS_SMOOTHING_BUFFER_SIZE) {
        buffer.shift();
      }

      // Вычисляем взвешенное среднее (последние значения важнее)
      // Используем линейно возрастающие веса для приоритета свежих данных
      let weightedSum = 0;
      let totalWeight = 0;

      buffer.forEach((value, index) => {
        const weight = index + 1; // Вес от 1 (старое) до COMPASS_SMOOTHING_BUFFER_SIZE (новое)
        weightedSum += value * weight;
        totalWeight += weight;
      });

      const smoothedValue = weightedSum / totalWeight;

      // Нормализуем результат
      let finalValue = smoothedValue;
      while (finalValue < 0) finalValue += 360;
      while (finalValue >= 360) finalValue -= 360;

      return buffer;
    });

    // Возвращаем текущее сглаженное значение для немедленного использования
    const currentBuffer = [...orientationBuffer];
    if (currentBuffer.length === 0) return normalized;

    let adjustedValue = normalized;
    if (currentBuffer.length > 0) {
      const lastValue = currentBuffer[currentBuffer.length - 1];
      const diff = normalized - lastValue;
      if (diff > 180) {
        adjustedValue = normalized - 360;
      } else if (diff < -180) {
        adjustedValue = normalized + 360;
      }
    }

    currentBuffer.push(adjustedValue);

    // Простое среднее для немедленного возврата
    const average = currentBuffer.reduce((sum, val) => sum + val, 0) / currentBuffer.length;
    let result = average;
    while (result < 0) result += 360;
    while (result >= 360) result -= 360;

    return result;
  };

  // Запрос разрешений для iOS
  const requestOrientationPermission = async () => {
    // Проверяем поддержку DeviceOrientationEvent
    if (typeof DeviceOrientationEvent === 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.log('DeviceOrientationEvent не поддерживается');
      }
      setOrientationSupported(false);
      setPermissionGranted(false);
      return false;
    }

    // iOS 13+ с обязательными разрешениями
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (process.env.NODE_ENV === 'development') {
          console.log('iOS permission result:', permission);
        }
        if (permission === 'granted') {
          setPermissionGranted(true);
          setOrientationSupported(true);
          return true;
        } else {
          setPermissionGranted(false);
          setOrientationSupported(true); // Поддерживается, но нет разрешения
          dispatch(setError('Необходимо разрешить доступ к компасу'));
          return false;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Permission request failed:', error);
        }
        setPermissionGranted(false);
        setOrientationSupported(true);
        dispatch(setError('Ошибка запроса разрешения компаса'));
        return false;
      }
    } else {
      // Старые браузеры без requestPermission - сразу разрешаем
      if (process.env.NODE_ENV === 'development') {
        console.log('Старый браузер - разрешение не требуется');
      }
      setPermissionGranted(true);
      setOrientationSupported(true);
      return true;
    }
  };

  // Local loading state for geolocation to avoid conflicts
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    // Get user location with local loading state
    setLocalLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Geolocation success:', position.coords);
          }
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          // Validate location data before dispatching
          if (typeof locationData.latitude === 'number' &&
              typeof locationData.longitude === 'number' &&
              !isNaN(locationData.latitude) &&
              !isNaN(locationData.longitude)) {
            dispatch(setUserLocation(locationData));
            setLocalLoading(false);
            if (process.env.NODE_ENV === 'development') {
              console.log('Location dispatched successfully');
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.error('Invalid location data:', locationData);
            }
            dispatch(setError('Получены неверные координаты'));
            setLocalLoading(false);
          }
        },
        (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Geolocation error:', error);
          }
          dispatch(setError('Не удалось получить геолокацию'));
          setLocalLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      dispatch(setError('Геолокация не поддерживается'));
      setLocalLoading(false);
    }

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [dispatch]);

  // GyroNorm компас инициализация
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Инициализация GyroNorm компаса...');
    }

    let gyroNorm = null;

    const initGyroNormCompass = () => {
      try {
        gyroNorm = new GyroNorm();

        if (process.env.NODE_ENV === 'development') {
          console.log('GyroNorm создан, инициализируем...');
        }

        gyroNorm.init({
          frequency: GYRO_UPDATE_FREQUENCY,
          gravityNormalized: true,
          orientationBase: GyroNorm.WORLD,
          decimalCount: 1,
          logger: null,
          screenAdjusted: false
        }).then(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('GyroNorm успешно инициализирован');
          }

          // Переменная для отслеживания последнего значения
          let lastSmoothedValue = null;

          // Слушаем изменения ориентации
          gyroNorm.start((data) => {
            // Получаем альфа (компас) из данных ориентации
            const compassHeading = data.do?.alpha;

            if (compassHeading !== null && compassHeading !== undefined && !isNaN(compassHeading)) {
              const smoothed = smoothOrientation(compassHeading);

              // Фильтруем малые изменения (динамическая чувствительность)
              if (lastSmoothedValue === null || Math.abs(smoothed - lastSmoothedValue) > sensitivity) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('GyroNorm compass heading:', compassHeading.toFixed(1), '-> smoothed:', smoothed.toFixed(1));
                }

                setDeviceOrientation(compassHeading);
                setSmoothedOrientation(smoothed);
                lastSmoothedValue = smoothed;

                setIsCalibrated(true);
                setOrientationSupported(true);
                setPermissionGranted(true);
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('GyroNorm: No valid compass data', data.do);
              }
            }
          });
        }).catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.error('GyroNorm ошибка инициализации:', error.message);
            console.log('Переходим на стандартный DeviceOrientation API');
          }
          initStandardOrientation();
        });

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('GyroNorm не поддерживается:', error.message);
          console.log('Используем стандартный DeviceOrientation API');
        }
        initStandardOrientation();
      }
    };

    // Fallback на стандартный API
    const initStandardOrientation = () => {
      const handleOrientation = (event) => {
        let compassHeading = null;

        if (event.alpha !== null && !isNaN(event.alpha)) {
          compassHeading = event.alpha;
        } else if (event.webkitCompassHeading !== null && !isNaN(event.webkitCompassHeading)) {
          compassHeading = 360 - event.webkitCompassHeading;
        }

        if (compassHeading !== null) {
          const smoothed = smoothOrientation(compassHeading);
          setDeviceOrientation(compassHeading);
          setSmoothedOrientation(smoothed);
          setIsCalibrated(true);
          setOrientationSupported(true);
          setPermissionGranted(true);
        }
      };

      if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission()
            .then(permission => {
              if (permission === 'granted') {
                setPermissionGranted(true);
                setOrientationSupported(true);
                window.addEventListener('deviceorientation', handleOrientation);
              }
            });
        } else {
          setPermissionGranted(true);
          setOrientationSupported(true);
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }
    };

    // Запускаем инициализацию GyroNorm
    initGyroNormCompass();

    // Fallback на ручной режим если автоматический компас не инициализировался
    const fallbackTimer = setTimeout(() => {
      if (!isCalibrated && !manualMode) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Включаем ручной режим компаса');
        }
        setManualMode(true);
        setOrientationSupported(true);
        setPermissionGranted(true);
      }
    }, COMPASS_FALLBACK_TIMEOUT);

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Очистка GyroNorm компаса');
      }
      if (gyroNorm) {
        try {
          gyroNorm.stop();
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Ошибка при остановке GyroNorm:', e);
          }
        }
      }
      clearTimeout(fallbackTimer);
      window.removeEventListener('deviceorientation', initStandardOrientation);
    };
  }, [isCalibrated, manualMode]);

  // Функция для ручного поворота компаса
  const handleManualRotation = (event) => {
    if (!manualMode) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;

    if (event.touches && event.touches[0]) {
      // Touch событие
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse событие
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Корректируем для компаса (север = 0°)

    if (process.env.NODE_ENV === 'development') {
      console.log('Manual rotation angle:', angle);
    }
    setManualOrientation(angle);
    setSmoothedOrientation(angle); // Прямое обновление без сглаживания для ручного режима
    if (process.env.NODE_ENV === 'development') {
      console.log('Updated smoothedOrientation to:', angle);
    }
  };

  const calculateQiblaDirection = () => {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No user location available for qibla calculation');
      }
      return 0;
    }

    const { latitude: userLat, longitude: userLng } = userLocation;

    if (process.env.NODE_ENV === 'development') {
      console.log('Calculating qibla for location:', { userLat, userLng });
    }

    const latRad1 = (userLat * Math.PI) / 180;
    const latRad2 = (MECCA_COORDINATES.latitude * Math.PI) / 180;
    const deltaLng = ((MECCA_COORDINATES.longitude - userLng) * Math.PI) / 180;

    const bearing = Math.atan2(
      Math.sin(deltaLng) * Math.cos(latRad2),
      Math.cos(latRad1) * Math.sin(latRad2) - Math.sin(latRad1) * Math.cos(latRad2) * Math.cos(deltaLng)
    );

    let bearingDegrees = (bearing * 180) / Math.PI;

    // Нормализуем к диапазону 0-360
    if (bearingDegrees < 0) {
      bearingDegrees += 360;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Calculated qibla direction:', bearingDegrees);
    }
    return bearingDegrees;
  };

  // Приоритет: пропс direction > Redux qiblaDirection > локальный расчет
  let qiblaDegree = 0;
  if (process.env.NODE_ENV === 'development') {
    console.log('Qibla direction sources:', {
      propDirection: direction,
      reduxQiblaDirection: qiblaDirection,
      userLocation: userLocation
    });
  }

  if (direction !== undefined && !isNaN(direction)) {
    qiblaDegree = direction;
    if (process.env.NODE_ENV === 'development') {
      console.log('Using prop direction:', qiblaDegree);
    }
  } else if (qiblaDirection !== undefined && qiblaDirection !== null && !isNaN(qiblaDirection)) {
    qiblaDegree = qiblaDirection;
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Redux qiblaDirection:', qiblaDegree);
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('Calculating qibla direction locally...');
    }
    qiblaDegree = calculateQiblaDirection();
    if (process.env.NODE_ENV === 'development') {
      console.log('Using calculated direction:', qiblaDegree);
    }
  }

  // Защита от NaN
  if (isNaN(qiblaDegree)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('qiblaDegree is NaN, setting to 0');
    }
    qiblaDegree = 0;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Final qibla degree:', qiblaDegree, {
      direction,
      qiblaDirection,
      userLocation,
      smoothedOrientation
    });
  }

  // Normalize angles to 0-360 range
  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

  // Calculate adjusted angles for display (используем сглаженные значения)
  const safeOrientation = isNaN(smoothedOrientation) ? 0 : smoothedOrientation;
  const safeQiblaDegree = isNaN(qiblaDegree) ? 0 : qiblaDegree;

  const northDirection = normalizeAngle(-safeOrientation);
  const qiblaDirectionAdjusted = normalizeAngle(safeQiblaDegree - safeOrientation);
  const deviceDirectionAdjusted = 0; // Device always points "up" in our view

  if (process.env.NODE_ENV === 'development') {
    console.log('Display angles:', {
      safeOrientation,
      safeQiblaDegree,
      northDirection,
      qiblaDirectionAdjusted
    });
  }

  if (localLoading || locationLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-white">Определение местоположения...</span>
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
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
          <p className="text-amber-200 text-sm mb-2">⚠️ Компас не поддерживается</p>
          <p className="text-amber-200 text-xs">
            Для автоматического компаса требуется:
          </p>
          <ul className="text-amber-200 text-xs mt-1 text-left ml-4">
            <li>• Современный браузер (Chrome, Safari)</li>
            <li>• HTTPS соединение</li>
            <li>• Разрешение на использование датчиков</li>
          </ul>
          <p className="text-amber-200 text-xs mt-2">
            Используйте ручной режим ниже для поворота компаса
          </p>
        </div>
      )}

      {orientationSupported && !permissionGranted && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <p className="text-blue-200 text-sm mb-2">📱 Требуется разрешение на доступ к компасу</p>
          <p className="text-blue-200 text-xs mb-3">
            Нажмите кнопку ниже и выберите "Разрешить" в появившемся окне
          </p>
          <button
            onClick={requestOrientationPermission}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors touch-manipulation"
          >
            Разрешить доступ к компасу
          </button>
        </div>
      )}

      {/* Manual Mode Notification */}
      {manualMode && (
        <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl">
          <p className="text-orange-200 text-sm mb-1">Ручной режим компаса</p>
          <p className="text-orange-200 text-xs">Коснитесь и поверните компас пальцем для указания севера</p>
        </div>
      )}

      {/* Calibration Status */}
      {permissionGranted && !isCalibrated && !manualMode && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-200 text-sm">Поверните устройство восьмеркой для калибровки</p>
        </div>
      )}

      {/* Interactive Compass */}
      <div
        className={`relative mx-auto mb-6 ${manualMode ? 'cursor-pointer' : ''}`}
        style={{ width: '320px', height: '320px' }}
        onClick={manualMode ? handleManualRotation : undefined}
        onTouchStart={manualMode ? handleManualRotation : undefined}
      >

        {/* Outer Ring with Degrees */}
        <div
          className={`absolute inset-0 rounded-full border-4 border-white/30 compass-stable ${
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
          <div className="text-white font-mono text-sm">{Math.round(deviceOrientation)}°</div>
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
          <div className="text-white font-mono text-sm">{isNaN(qiblaDirectionAdjusted) ? '--' : Math.round(qiblaDirectionAdjusted)}°</div>
        </div>
      </div>

      {/* Accuracy Info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <Compass className="w-4 h-4" />
          <span>Точность: ±{magneticDeclination ? '3' : '5'}°</span>
        </div>

        {/* Sensitivity Control */}
        {isCalibrated && !manualMode && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-white/60 text-xs">Чувствительность:</span>
            <button
              onClick={() => setSensitivity(Math.max(1, sensitivity - 0.5))}
              className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded text-white text-xs transition-colors"
              disabled={sensitivity <= 1}
            >
              −
            </button>
            <span className="text-white text-xs font-mono w-8 text-center">{sensitivity}°</span>
            <button
              onClick={() => setSensitivity(Math.min(5, sensitivity + 0.5))}
              className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded text-white text-xs transition-colors"
              disabled={sensitivity >= 5}
            >
              +
            </button>
          </div>
        )}

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