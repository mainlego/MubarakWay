import React, { useEffect, useState, useRef } from 'react';
import { getQiblaDirection } from '@masaajid/qibla';
import { Navigation, Compass } from 'lucide-react';

const QiblaCompass = () => {
  // States
  const [qiblaData, setQiblaData] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [calibrationNeeded, setCalibrationNeeded] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Refs for smoothing
  const lastHeading = useRef(0);
  const animationFrameRef = useRef(null);

  // Detect platform
  useEffect(() => {
    const ios = typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function';
    setIsIOS(ios);
  }, []);

  // Get user location
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

        // Calculate Qibla direction using @masaajid/qibla
        try {
          const result = getQiblaDirection(location, {
            bearingPrecision: 2,
            distancePrecision: 2,
            includeCardinalDirection: true,
            includeMagneticDeclination: false
          });

          setQiblaData(result);
          setLoading(false);
          console.log('Qibla calculation:', result);
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

  // Request device orientation permission (iOS)
  const requestOrientationPermission = async () => {
    if (!isIOS) {
      setPermissionGranted(true);
      startCompass();
      return;
    }

    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        startCompass();
      } else {
        setError('Доступ к компасу отклонен');
      }
    } catch (err) {
      console.error('Permission error:', err);
      setError('Ошибка запроса доступа к компасу');
    }
  };

  // Smooth angle interpolation
  const smoothAngle = (target, current, factor = 0.15) => {
    // Calculate shortest distance
    let diff = target - current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // Apply smoothing
    const smoothed = current + diff * factor;
    return (smoothed + 360) % 360;
  };

  // Handle device orientation
  const handleOrientation = (event) => {
    let heading = null;

    // iOS: use webkitCompassHeading
    if (event.webkitCompassHeading !== undefined) {
      heading = event.webkitCompassHeading;
    }
    // Android: use alpha with absolute orientation
    else if (event.absolute && event.alpha !== null) {
      heading = 360 - event.alpha;
    }

    if (heading !== null) {
      // Smooth the heading
      const smoothed = smoothAngle(heading, lastHeading.current);
      lastHeading.current = smoothed;

      // Update state with throttling
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        setDeviceHeading(smoothed);
      });
    }

    // Check calibration status
    if (event.webkitCompassAccuracy !== undefined) {
      setCalibrationNeeded(event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 20);
    }
  };

  // Start compass
  const startCompass = () => {
    if (isIOS) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      // Fallback for non-absolute
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  // Request permission button handler
  const handleEnableCompass = () => {
    requestOrientationPermission();
  };

  // Calculate relative Qibla direction (relative to device heading)
  const getRelativeQiblaDirection = () => {
    if (!qiblaData) return 0;
    return (qiblaData.bearing - deviceHeading + 360) % 360;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <Compass className="w-16 h-16 text-emerald-400 animate-spin mb-4" />
        <p className="text-white/70 text-center">Определение вашего местоположения...</p>
      </div>
    );
  }

  // Error state
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

  // Permission request state
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
            onClick={handleEnableCompass}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Включить компас
          </button>
        </div>
      </div>
    );
  }

  const relativeQibla = getRelativeQiblaDirection();
  const distanceKm = qiblaData?.distance ? (qiblaData.distance / 1000).toFixed(0) : '—';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      {/* Calibration warning */}
      {calibrationNeeded && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 max-w-md">
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Требуется калибровка компаса. Поверните устройство восьмеркой.
          </p>
        </div>
      )}

      {/* Location info */}
      <div className="mb-6 text-center">
        <p className="text-white/50 text-sm">
          {userLocation?.latitude.toFixed(4)}°, {userLocation?.longitude.toFixed(4)}°
        </p>
        <p className="text-white/70 text-sm mt-1">
          {qiblaData?.cardinalDirection} • {qiblaData?.bearing.toFixed(1)}° • {distanceKm} км до Мекки
        </p>
      </div>

      {/* Compass container */}
      <div className="relative w-80 h-80 mb-6">
        {/* Compass rose background */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 shadow-2xl"
          style={{
            transform: `rotate(${-deviceHeading}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}
        >
          {/* Cardinal directions */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-bold text-xl">N</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 font-bold text-lg">S</div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg">W</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg">E</div>

          {/* Degree markers */}
          {[...Array(36)].map((_, i) => {
            const angle = i * 10;
            const isMajor = angle % 30 === 0;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-0 origin-bottom"
                style={{
                  height: '50%',
                  transform: `rotate(${angle}deg)`
                }}
              >
                <div
                  className={`mx-auto ${isMajor ? 'w-0.5 h-4 bg-white/70' : 'w-0.5 h-2 bg-white/30'}`}
                />
              </div>
            );
          })}
        </div>

        {/* Qibla direction arrow */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `rotate(${relativeQibla}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}
        >
          <div className="flex flex-col items-center">
            <Navigation
              className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]"
              fill="currentColor"
            />
            <div className="mt-2 text-emerald-300 text-sm font-semibold">الكعبة</div>
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
      </div>

      {/* Direction indicator */}
      <div className="text-center mb-4">
        <p className="text-white/50 text-sm mb-1">Направление на Киблу</p>
        <p className="text-4xl font-bold text-emerald-400">
          {relativeQibla.toFixed(0)}°
        </p>
      </div>

      {/* Debug toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-white/30 hover:text-white/50 text-xs mb-2 transition-colors"
      >
        {showDebug ? '▼' : '▶'} Отладка
      </button>

      {/* Debug panel */}
      {showDebug && (
        <div className="w-full max-w-md bg-black/80 backdrop-blur-sm rounded-xl p-4 text-left">
          <h3 className="text-yellow-300 font-bold text-sm mb-2">📊 Панель отладки</h3>
          <div className="bg-white/10 rounded p-3 text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-white/50">Qibla bearing:</span>
              <span className="text-emerald-300">{qiblaData?.bearing.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Device heading:</span>
              <span className="text-blue-300">{deviceHeading.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Relative Qibla:</span>
              <span className="text-emerald-300">{relativeQibla.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Distance:</span>
              <span className="text-white/70">{distanceKm} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Cardinal:</span>
              <span className="text-white/70">{qiblaData?.cardinalDirection}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Platform:</span>
              <span className="text-white/70">{isIOS ? 'iOS' : 'Android/Other'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QiblaCompass;
