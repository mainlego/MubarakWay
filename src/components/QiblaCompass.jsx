import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserLocation, setLoading, setError } from '../store/slices/qiblaSlice';
import { Navigation, MapPin, Clock } from 'lucide-react';

const QiblaCompass = () => {
  const dispatch = useDispatch();
  const { qiblaDirection, userLocation, prayerTimes, loading, error } = useSelector(state => state.qibla);
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

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

    // Device orientation (if supported)
    if (window.DeviceOrientationEvent) {
      const handleOrientation = (event) => {
        setDeviceOrientation(event.alpha || 0);
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        clearInterval(timeInterval);
      };
    }

    return () => clearInterval(timeInterval);
  }, [dispatch]);

  const calculateQiblaDirection = () => {
    if (!userLocation) return 0;

    // Mecca coordinates
    const meccaLat = 21.4225;
    const meccaLng = 39.8262;

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

  const qiblaDegree = calculateQiblaDirection();

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
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Digital Clock */}
      <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
        <div className="text-2xl font-bold text-white">
          {currentTime.toLocaleTimeString('ru-RU')}
        </div>
        <div className="text-sm text-white/80">
          {currentTime.toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Compass */}
      <div className="relative mx-auto mb-6" style={{ width: '280px', height: '280px' }}>
        {/* Compass Background */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-full border-4 border-white/30">
          {/* Compass Rose */}
          <div className="absolute inset-4 rounded-full border border-white/20">
            {/* Direction markers */}
            {['N', 'E', 'S', 'W'].map((direction, index) => (
              <div
                key={direction}
                className="absolute text-white font-bold text-lg"
                style={{
                  top: index === 0 ? '8px' : index === 2 ? 'auto' : '50%',
                  bottom: index === 2 ? '8px' : 'auto',
                  left: index === 3 ? '8px' : index === 1 ? 'auto' : '50%',
                  right: index === 1 ? '8px' : 'auto',
                  transform: (index === 0 || index === 2) ? 'translateX(-50%)' : (index === 1 || index === 3) ? 'translateY(-50%)' : 'none'
                }}
              >
                {direction}
              </div>
            ))}

            {/* Qibla Direction Arrow */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${qiblaDegree - deviceOrientation}deg)`
              }}
            >
              <div className="w-1 bg-green-500 rounded-full" style={{ height: '100px', marginTop: '-50px' }}>
                <div className="w-6 h-6 bg-green-500 rounded-full -mt-3 -ml-2.5 flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -mt-2 -ml-2 border-2 border-green-500"></div>
      </div>

      {/* Location info */}
      <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
        <div className="flex items-center justify-center gap-2 text-white">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {userLocation
              ? `${userLocation.latitude.toFixed(4)}°, ${userLocation.longitude.toFixed(4)}°`
              : 'Определяем местоположение...'
            }
          </span>
        </div>
        <div className="text-white/80 text-xs mt-1">
          Направление на Мекку: {qiblaDegree.toFixed(1)}°
        </div>
      </div>
    </div>
  );
};

export default QiblaCompass;