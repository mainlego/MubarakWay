import React, { useEffect, useState, useRef } from 'react';
import { getQiblaDirection } from '@masaajid/qibla';
import { Navigation, Compass } from 'lucide-react';

const QiblaCompass = () => {
  // States
  const [qiblaData, setQiblaData] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPointingToQibla, setIsPointingToQibla] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Refs
  const animationFrameRef = useRef(null);

  // Detect iOS
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
            distancePrecision: 0,
            includeCardinalDirection: true,
            includeMagneticDeclination: false
          });

          console.log('Qibla calculation:', result);
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

  // Request device orientation permission (iOS)
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
          setError('Доступ к компасу отклонен');
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

  // Handle device orientation (based on dev.to article)
  const handleOrientation = (event) => {
    let compass = 0;

    // Use webkitCompassHeading for iOS, or calculate from alpha
    if (event.webkitCompassHeading) {
      // iOS devices
      compass = event.webkitCompassHeading;
    } else {
      // Android devices
      compass = Math.abs(event.alpha - 360);
    }

    // Update compass heading with animation frame for smooth performance
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setCompassHeading(compass);

      // Check if pointing to Qibla (within ±15 degrees)
      if (qiblaData) {
        const diff = Math.abs(qiblaData.bearing - compass);
        const isPointing = diff <= 15 || diff >= 345;
        setIsPointingToQibla(isPointing);
      }
    });
  };

  // Start compass
  const startCompass = () => {
    if (isIOS) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      // Try deviceorientationabsolute first (Android)
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      // Fallback to regular deviceorientation
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  // Request permission button handler
  const handleEnableCompass = () => {
    requestOrientationPermission();
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

  const distanceKm = qiblaData?.distance ? Math.round(qiblaData.distance / 1000) : '—';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      {/* Pointing to Qibla indicator */}
      {isPointingToQibla && (
        <div className="mb-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 max-w-md animate-pulse">
          <p className="text-emerald-300 text-sm text-center font-semibold">
            ✓ Вы направлены на Киблу!
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
        {/* Rotating compass (rotates based on device heading) */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 shadow-2xl transition-transform duration-300 ease-out"
          style={{
            transform: `translate(-50%, -50%) rotate(${-compassHeading}deg)`,
            top: '50%',
            left: '50%'
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

          {/* Qibla direction marker on compass ring */}
          <div
            className="absolute left-1/2 top-0 origin-bottom"
            style={{
              height: '50%',
              transform: `rotate(${qiblaData?.bearing}deg)`
            }}
          >
            <div className={`mx-auto w-1 h-8 ${isPointingToQibla ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' : 'bg-emerald-500'} transition-all duration-300`} />
          </div>
        </div>

        {/* Static device pointer (red arrow at top) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-6 pointer-events-none">
          <div className="flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[24px] border-b-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <div className="mt-1 text-red-400 text-xs font-bold">ВЫ</div>
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg z-10" />
      </div>

      {/* Direction indicator */}
      <div className="text-center mb-4">
        <p className="text-white/50 text-sm mb-1">Направление на Киблу</p>
        <p className="text-4xl font-bold text-emerald-400">
          {qiblaData?.bearing.toFixed(0)}°
        </p>
        <p className="text-white/50 text-xs mt-2">
          Текущий курс: {compassHeading.toFixed(0)}°
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
              <span className="text-white/50">Compass heading:</span>
              <span className="text-blue-300">{compassHeading.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Difference:</span>
              <span className="text-yellow-300">{Math.abs(qiblaData?.bearing - compassHeading).toFixed(2)}°</span>
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
            <div className="flex justify-between">
              <span className="text-white/50">Pointing to Qibla:</span>
              <span className={isPointingToQibla ? 'text-emerald-300' : 'text-red-300'}>
                {isPointingToQibla ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QiblaCompass;
