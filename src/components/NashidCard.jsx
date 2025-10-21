import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Pause, Heart, Download, HardDrive, CloudDownload } from 'lucide-react';
import { playNashid, pauseNashid, toggleFavoriteNashid } from '../store/slices/nashidsSlice';
import { selectUser } from '../store/slices/authSlice';
import { useOfflineNashids } from '../hooks/useOffline';
import { telegram } from '../utils/telegram';

const NashidCard = ({ nashid, onPlay }) => {
  const dispatch = useDispatch();
  const { currentPlaying, isPlaying, favorites } = useSelector(state => state.nashids);
  const user = useSelector(selectUser);
  const { saveNashidOffline, isNashidAvailableOffline } = useOfflineNashids();
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isCurrentlyPlaying = currentPlaying?.id === nashid.id && isPlaying;
  const isFavorite = favorites.includes(nashid.id);

  useEffect(() => {
    const checkOfflineAvailability = async () => {
      const available = await isNashidAvailableOffline(nashid.id);
      setIsOfflineAvailable(available);
    };
    checkOfflineAvailability();
  }, [nashid.id, isNashidAvailableOffline]);

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      dispatch(pauseNashid());
    } else {
      dispatch(playNashid(nashid));
      if (onPlay) {
        onPlay(nashid);
      }
    }
  };

  const handleFavorite = (e) => {
    e.stopPropagation();

    console.log('[NashidCard] handleFavorite clicked', {
      nashidId: nashid.id,
      nashidTitle: nashid.title,
      user: user,
      userTelegramId: user?.telegramId,
      userFirstName: user?.firstName,
      isAuthenticated: !!user,
      currentFavorites: favorites
    });

    // Используем MongoDB thunk если пользователь авторизован
    if (user?.telegramId) {
      console.log('[NashidCard] Dispatching toggleFavoriteNashid with:', {
        telegramId: user.telegramId,
        nashidId: nashid.id
      });
      dispatch(toggleFavoriteNashid({
        telegramId: user.telegramId,
        nashidId: nashid.id
      }));
    } else {
      console.warn('[NashidCard] User not logged in, favorites not saved to MongoDB', { user });
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();

    // Если в Telegram Mini App - отправляем в чат с ботом
    if (telegram.isMiniApp()) {
      await telegram.sendAudioToBot(nashid);
    } else {
      // В браузере - сохраняем офлайн
      if (!isOfflineAvailable && !isDownloading) {
        setIsDownloading(true);
        try {
          const response = await fetch(nashid.audioUrl);
          const audioBlob = await response.blob();
          await saveNashidOffline(nashid, audioBlob);
          setIsOfflineAvailable(true);
          alert('Нашид сохранён для офлайн прослушивания');
        } catch (error) {
          console.error('Error downloading nashid:', error);
          alert('Ошибка при скачивании нашида');
        } finally {
          setIsDownloading(false);
        }
      }
    }
  };

  return (
    <div
      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer"
      onClick={handlePlay}
    >
      <div className="flex items-center space-x-4">
        {/* Cover Image */}
        <div className="relative">
          <img
            src={nashid.cover || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"}
            alt={nashid.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </div>
          {isCurrentlyPlaying && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${
            isCurrentlyPlaying ? 'text-green-300' : 'text-white'
          }`}>
            {nashid.title}
          </h3>
          {nashid.titleTransliteration && (
            <p className="text-white/70 text-xs truncate">{nashid.titleTransliteration}</p>
          )}
          <p className="text-white/80 text-sm truncate">{nashid.artist}</p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-white/60 text-xs">{nashid.duration}</p>
            {nashid.category && (
              <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 text-xs rounded-full">
                {nashid.category}
              </span>
            )}
            {isOfflineAvailable && (
              <HardDrive className="w-3 h-3 text-green-400" title="Доступно офлайн" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full transition-colors ${
              isFavorite
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`p-2 rounded-full transition-colors ${
              isOfflineAvailable
                ? 'bg-green-500/20 text-green-400'
                : isDownloading
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={
              telegram.isMiniApp()
                ? 'Отправить в чат с ботом'
                : isOfflineAvailable
                ? 'Сохранено для офлайн'
                : isDownloading
                ? 'Скачивание...'
                : 'Скачать для офлайн'
            }
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isOfflineAvailable ? (
              <HardDrive className="w-4 h-4" />
            ) : (
              <CloudDownload className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NashidCard;