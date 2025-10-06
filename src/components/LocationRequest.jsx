import { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import { authAPI } from '../services/api';

const LocationRequest = ({ isOpen, onClose, onLocationSet, telegramId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Геолокация не поддерживается вашим браузером');
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          console.log('📍 Location obtained:', latitude, longitude);

          // Сохраняем в MongoDB
          try {
            await authAPI.saveLocation(telegramId, latitude, longitude);
            console.log('✅ Location saved to MongoDB');

            // Уведомляем родительский компонент
            onLocationSet({ latitude, longitude });
            onClose();
          } catch (apiError) {
            console.error('Failed to save location:', apiError);
            setError('Не удалось сохранить геолокацию. Попробуйте снова.');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);

          switch(error.code) {
            case error.PERMISSION_DENIED:
              setError('Вы отклонили запрос на доступ к геолокации. Разрешите доступ в настройках браузера.');
              break;
            case error.POSITION_UNAVAILABLE:
              setError('Информация о местоположении недоступна.');
              break;
            case error.TIMEOUT:
              setError('Превышено время ожидания запроса геолокации.');
              break;
            default:
              setError('Произошла неизвестная ошибка при получении геолокации.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Location request error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Геолокация</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Для точного расчета времени молитв нам нужна ваша геолокация.
          </p>
          <p className="text-sm text-gray-500">
            Мы используем её только для определения времени намаза. Данные не передаются третьим лицам.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={requestLocation}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Получение...</span>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                <span>Разрешить доступ</span>
              </>
            )}
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          При отказе будет использована локация по умолчанию (Москва)
        </p>
      </div>
    </div>
  );
};

export default LocationRequest;
