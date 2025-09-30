import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserLocation, setLoading, setError } from '../store/slices/qiblaSlice';
import { Navigation, Compass } from 'lucide-react';

const QiblaCompass = ({ direction, isAnimating = false }) => {
  const dispatch = useDispatch();
  const { qiblaDirection, userLocation, locationLoading, error } = useSelector(state => state.qibla);

  // States
  const [smoothedOrientation, setSmoothedOrientation] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  // Refs for performance (no re-render on change)
  const lastUpdateTime = useRef(0);
  const lastHeading = useRef(0);
  const smoothingAlpha = useRef(0.15); // Low-pass filter coefficient (0-1, lower = smoother)

  // Constants
  const UPDATE_INTERVAL = 200; // Update every 200ms = 5 FPS
  const DEADZONE_DEGREES = 3; // Ignore changes smaller than 3°

  // Detect iOS
  useEffect(() => {
    const ios = typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function';
    setIsIOS(ios);
    console.log('Platform detected:', ios ? 'iOS' : 'Android/Other');
  }, []);

  // Get user location
  useEffect(() => {
    setLocalLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          if (typeof locationData.latitude === 'number' &&
              typeof locationData.longitude === 'number' &&
              !isNaN(locationData.latitude) &&
              !isNaN(locationData.longitude)) {
            dispatch(setUserLocation(locationData));
            setLocalLoading(false);
            console.log('Location obtained:', locationData);
          } else {
            dispatch(setError('Получены неверные координаты'));
            setLocalLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
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
  }, [dispatch]);

  // Normalize angle to 0-360
  const normalizeAngle = useCallback((angle) => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  }, []);

  // Calculate angle difference (shortest path, handling 360°/0° wrap)
  const angleDifference = useCallback((a, b) => {
    let diff = a - b;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }, []);

  // Exponential smoothing filter (low-pass filter)
  const applyLowPassFilter = useCallback((newValue, oldValue, alpha) => {
    // Handle 360°/0° boundary
    const diff = angleDifference(newValue, oldValue);
    const smoothed = oldValue + diff * alpha;
    return normalizeAngle(smoothed);
  }, [angleDifference, normalizeAngle]);

  // Throttled orientation update with deadzone
  const updateOrientation = useCallback((heading) => {
    const now = Date.now();

    // Throttle: only update every UPDATE_INTERVAL ms
    if (now - lastUpdateTime.current < UPDATE_INTERVAL) {
      return;
    }

    // Normalize heading
    heading = normalizeAngle(heading);

    // Deadzone: ignore small changes
    const diff = Math.abs(angleDifference(heading, lastHeading.current));
    if (diff < DEADZONE_DEGREES && lastHeading.current !== 0) {
      return;
    }

    // Apply low-pass filter for smooth motion
    const smoothed = lastHeading.current === 0
      ? heading // First value
      : applyLowPassFilter(heading, lastHeading.current, smoothingAlpha.current);

    // Update refs and state
    lastHeading.current = smoothed;
    lastUpdateTime.current = now;
    setSmoothedOrientation(smoothed);

    if (!isCalibrated) {
      setIsCalibrated(true);
    }
  }, [normalizeAngle, angleDifference, applyLowPassFilter, isCalibrated]);

  // Request iOS permission
  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      console.log('DeviceOrientationEvent not supported');
      setPermissionGranted(false);
      return false;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        console.log('iOS permission result:', permission);
        if (permission === 'granted') {
          setPermissionGranted(true);
          return true;
        } else {
          setPermissionGranted(false);
          dispatch(setError('Необходимо разрешить доступ к компасу'));
          return false;
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        setPermissionGranted(false);
        dispatch(setError('Ошибка запроса разрешения компаса'));
        return false;
      }
    } else {
      console.log('Old browser - no permission required');
      setPermissionGranted(true);
      return true;
    }
  };

  // Initialize compass with native APIs
  useEffect(() => {
    let orientationListener = null;
    let absoluteOrientationListener = null;

    const initCompass = async () => {
      console.log('Initializing compass...');

      // iOS handler - uses webkitCompassHeading (most reliable on iOS)
      const handleIOSOrientation = (event) => {
        let heading = null;

        // iOS Safari provides webkitCompassHeading (0-360, 0 = North)
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
          heading = event.webkitCompassHeading;
        }
        // Fallback to alpha
        else if (event.alpha !== null) {
          heading = 360 - event.alpha;
        }

        if (heading !== null && !isNaN(heading)) {
          updateOrientation(heading);
        }
      };

      // Android handler - improved formula with quaternion-like calculation
      const handleAndroidOrientation = (event) => {
        if (event.alpha === null || event.beta === null || event.gamma === null) {
          return;
        }

        // Check if event is absolute (has magnetometer data)
        const isAbsolute = event.absolute === true;

        if (isAbsolute) {
          // For absolute orientation, use more stable formula
          // This works better when device is held in various positions
          const alpha = event.alpha * Math.PI / 180; // Z axis
          const beta = event.beta * Math.PI / 180;   // X axis
          const gamma = event.gamma * Math.PI / 180; // Y axis

          // Simplified formula that works for most device positions
          // Based on the rotation matrix approach
          let heading;

          if (Math.abs(beta) < Math.PI / 4) {
            // Device held relatively flat
            heading = alpha * 180 / Math.PI;
          } else {
            // Device tilted - use compensated formula
            const x = Math.sin(gamma) * Math.cos(beta);
            const y = -Math.sin(beta);
            heading = Math.atan2(x, y) * 180 / Math.PI + alpha * 180 / Math.PI;
          }

          heading = normalizeAngle(heading);
          updateOrientation(heading);
        } else {
          // Relative orientation - use simple alpha
          const heading = normalizeAngle(360 - event.alpha);
          updateOrientation(heading);
        }
      };

      if (isIOS) {
        // iOS: Request permission first, then use deviceorientation
        const granted = await requestOrientationPermission();
        if (granted) {
          orientationListener = handleIOSOrientation;
          window.addEventListener('deviceorientation', orientationListener, true);
          console.log('✅ iOS compass initialized');
        }
      } else {
        // Android: Try deviceorientationabsolute first
        absoluteOrientationListener = handleAndroidOrientation;
        window.addEventListener('deviceorientationabsolute', absoluteOrientationListener, true);

        // Fallback to regular deviceorientation if absolute not available
        setTimeout(() => {
          if (!isCalibrated) {
            console.log('Falling back to deviceorientation (not absolute)');
            window.removeEventListener('deviceorientationabsolute', absoluteOrientationListener, true);
            orientationListener = handleIOSOrientation;
            window.addEventListener('deviceorientation', orientationListener, true);
          }
        }, 1000);

        console.log('✅ Android compass initialized');
        setPermissionGranted(true);
      }
    };

    initCompass();

    // Cleanup
    return () => {
      if (orientationListener) {
        window.removeEventListener('deviceorientation', orientationListener, true);
      }
      if (absoluteOrientationListener) {
        window.removeEventListener('deviceorientationabsolute', absoluteOrientationListener, true);
      }
      console.log('Compass cleaned up');
    };
  }, [isIOS, isCalibrated, updateOrientation, normalizeAngle, dispatch]);

  // Get qibla degree from props or redux
  let qiblaDegree = 0;
  let qiblaSource = 'none';
  if (direction !== undefined && direction !== null && !isNaN(direction)) {
    qiblaDegree = direction;
    qiblaSource = 'props';
  } else if (qiblaDirection !== undefined && qiblaDirection !== null && !isNaN(qiblaDirection)) {
    qiblaDegree = qiblaDirection;
    qiblaSource = 'redux';
  }

  const safeOrientation = isNaN(smoothedOrientation) ? 0 : smoothedOrientation;
  const safeQiblaDegree = isNaN(qiblaDegree) ? 0 : qiblaDegree;

  // Calculate arrow rotations
  const deviceDirectionAdjusted = 0; // Device always points "up"
  const northDirection = normalizeAngle(-safeOrientation);
  const qiblaDirectionAdjusted = normalizeAngle(safeQiblaDegree - safeOrientation);

  // Add debug log helper
  const addDebugLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => {
      const newLogs = [...prev, { time: timestamp, msg: message }];
      // Keep only last 10 logs
      return newLogs.slice(-10);
    });
  }, []);

  // Debug logging - update every second
  useEffect(() => {
    const interval = setInterval(() => {
      const debugInfo = {
        source: qiblaSource,
        qiblaAbs: Math.round(safeQiblaDegree),
        deviceOri: Math.round(safeOrientation),
        qiblaRel: Math.round(qiblaDirectionAdjusted),
        northDir: Math.round(northDirection)
      };
      console.log('🧭 Compass Debug:', debugInfo);
      addDebugLog(JSON.stringify(debugInfo, null, 2));
    }, 1000);
    return () => clearInterval(interval);
  }, [qiblaSource, safeQiblaDegree, safeOrientation, qiblaDirectionAdjusted, northDirection, addDebugLog]);

  // Loading state
  if (localLoading || locationLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-white">Определение местоположения...</span>
      </div>
    );
  }

  // Error state
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

  // Permission request for iOS
  if (isIOS && !permissionGranted) {
    return (
      <div className="text-center p-8">
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <p className="text-blue-200 text-sm mb-2">📱 Требуется разрешение на доступ к компасу</p>
          <p className="text-blue-200 text-xs mb-3">
            Нажмите кнопку ниже и выберите "Разрешить" в появившемся окне
          </p>
          <button
            onClick={requestOrientationPermission}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Разрешить доступ к компасу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Calibration reminder */}
      {permissionGranted && !isCalibrated && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-200 text-sm">Поверните устройство восьмеркой для калибровки</p>
        </div>
      )}

      {/* Interactive Compass */}
      <div
        className="relative mx-auto mb-6"
        style={{ width: '320px', height: '320px' }}
      >
        {/* Outer Ring with Degrees */}
        <div
          className={`absolute inset-0 rounded-full border-4 border-white/30 ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{
            transform: `rotate(${-smoothedOrientation}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
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
                  transform: `translateX(-50%) rotate(${angle - smoothedOrientation}deg)`,
                  transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
                }}
              >
                <span style={{ transform: `rotate(${-(angle - smoothedOrientation)}deg)`, display: 'inline-block' }}>
                  {dir}
                </span>
              </div>
            ))}
          </div>

          {/* Device Arrow (Red) - always points up */}
          <div
            className="absolute inset-0 flex items-center justify-center"
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
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `rotate(${northDirection}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
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
            className={`absolute inset-0 flex items-center justify-center ${
              isAnimating ? 'animate-bounce' : ''
            }`}
            style={{
              transform: `rotate(${qiblaDirectionAdjusted}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
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
          <div className="text-white font-mono text-sm">{Math.round(smoothedOrientation)}°</div>
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
          <div className="text-white font-mono text-sm">
            {isNaN(qiblaDirectionAdjusted) ? '--' : Math.round(qiblaDirectionAdjusted)}°
          </div>
          <div className="text-white/40 font-mono text-xs">({Math.round(safeQiblaDegree)}° абс)</div>
        </div>
      </div>

      {/* Accuracy Info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <Compass className="w-4 h-4" />
          <span>Точность: ±3° | Обновление: 5 FPS</span>
        </div>

        {userLocation && (
          <div className="text-white/60 text-xs mt-1">
            {userLocation.latitude.toFixed(4)}°, {userLocation.longitude.toFixed(4)}°
          </div>
        )}

        {/* Debug Toggle Button */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="mt-2 w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-xs py-1 px-2 rounded transition-colors"
        >
          {showDebug ? '🔍 Скрыть отладку' : '🔍 Показать отладку'}
        </button>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="mt-4 bg-black/80 backdrop-blur-sm rounded-xl p-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-yellow-300 font-bold text-sm">📊 Панель отладки</h3>
            <button
              onClick={() => setDebugLogs([])}
              className="text-xs text-red-300 hover:text-red-400"
            >
              Очистить
            </button>
          </div>

          {/* Current Values */}
          <div className="bg-white/10 rounded p-2 mb-2 text-xs font-mono">
            <div className="grid grid-cols-2 gap-1 text-white/90">
              <div>Источник: <span className="text-green-300">{qiblaSource}</span></div>
              <div>Мекка абс: <span className="text-green-300">{Math.round(safeQiblaDegree)}°</span></div>
              <div>Устройство: <span className="text-red-300">{Math.round(safeOrientation)}°</span></div>
              <div>Мекка отн: <span className="text-green-300">{Math.round(qiblaDirectionAdjusted)}°</span></div>
              <div>Север: <span className="text-blue-300">{Math.round(northDirection)}°</span></div>
              <div>Калибровка: <span className={isCalibrated ? 'text-green-300' : 'text-red-300'}>{isCalibrated ? 'ДА' : 'НЕТ'}</span></div>
            </div>
          </div>

          {/* Log History */}
          <div className="bg-white/5 rounded p-2 max-h-40 overflow-y-auto">
            <div className="text-white/60 text-xs mb-1">История (последние 10):</div>
            {debugLogs.length === 0 ? (
              <div className="text-white/40 text-xs">Нет логов</div>
            ) : (
              debugLogs.map((log, idx) => (
                <div key={idx} className="text-white/70 text-xs font-mono mb-1 border-b border-white/10 pb-1">
                  <div className="text-white/50">[{log.time}]</div>
                  <pre className="whitespace-pre-wrap">{log.msg}</pre>
                </div>
              ))
            )}
          </div>

          {/* Explanation */}
          <div className="mt-2 p-2 bg-blue-500/10 rounded text-xs text-blue-200">
            <div className="font-bold mb-1">Пояснение:</div>
            <div>• <b>source</b> - откуда берётся направление к Мекке</div>
            <div>• <b>qiblaAbs</b> - абсолютный азимут к Мекке (0-360°)</div>
            <div>• <b>deviceOri</b> - куда смотрит телефон (0-360°)</div>
            <div>• <b>qiblaRel</b> - куда указывает зелёная стрелка</div>
            <div>• <b>northDir</b> - куда указывает синяя стрелка</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QiblaCompass;