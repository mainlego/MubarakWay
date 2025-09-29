import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Download,
  Share2,
  List,
  Minimize2
} from 'lucide-react';
import { playNashid, pauseNashid, stopNashid, toggleFavorite } from '../store/slices/nashidsSlice';
import { useOfflineNashids } from '../hooks/useOffline';

const AudioPlayer = ({ nashid, playlist = [], onClose, isMinimized, onToggleMinimize }) => {
  const dispatch = useDispatch();
  const { favorites, isPlaying } = useSelector(state => state.nashids);
  const { saveNashidOffline, isNashidAvailableOffline } = useOfflineNashids();

  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // none, all, one
  const [isLoading, setIsLoading] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => handleNext();
    const handlePause = () => {
      // Если плеер должен играть, но был поставлен на паузу не пользователем
      if (isPlaying && !audio.ended) {
        setTimeout(() => {
          if (isPlaying) {
            audio.play().catch(console.error);
          }
        }, 100);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const checkOfflineAvailability = async () => {
      if (nashid) {
        const available = await isNashidAvailableOffline(nashid.id);
        setIsOfflineAvailable(available);
      }
    };
    checkOfflineAvailability();
  }, [nashid, isNashidAvailableOffline]);

  // Основное управление воспроизведением - только при смене трека или по действию пользователя
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && nashid) {
      if (isPlaying) {
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, nashid]);

  // Предотвращаем остановку при изменении состояния минимизации
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      // Если должно играть, то пусть играет независимо от минимизации
      setTimeout(() => {
        if (!audio.paused) return; // Уже играет
        audio.play().catch(console.error);
      }, 50); // Небольшая задержка чтобы дать время на рендер
    }
  }, [isMinimized, isPlaying]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      dispatch(pauseNashid());
      // Явно ставим на паузу
      if (audio && !audio.paused) {
        audio.pause();
      }
    } else {
      dispatch(playNashid(nashid));
      // Явно запускаем
      if (audio && audio.paused) {
        audio.play().catch(console.error);
      }
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;

    const currentIndex = playlist.findIndex(n => n.id === nashid.id);
    let nextIndex;

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else if (repeatMode === 'one') {
      nextIndex = currentIndex;
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    const nextNashid = playlist[nextIndex];
    dispatch(playNashid(nextNashid));
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;

    const currentIndex = playlist.findIndex(n => n.id === nashid.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevNashid = playlist[prevIndex];
    dispatch(playNashid(prevNashid));
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const handleFavorite = () => {
    dispatch(toggleFavorite(nashid.id));
  };

  const handleDownload = async () => {
    try {
      // Попытка скачать аудиофайл для офлайн прослушивания
      const response = await fetch(nashid.audioUrl);
      const audioBlob = await response.blob();
      await saveNashidOffline(nashid, audioBlob);
      setIsOfflineAvailable(true);
    } catch (error) {
      console.error('Error downloading nashid:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: nashid.title,
          text: `Слушаю нашид: ${nashid.title} - ${nashid.artist}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${nashid.title} - ${nashid.artist}`);
      alert('Информация о нашиде скопирована в буфер обмена');
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat1 className="w-5 h-5" />;
      case 'all':
        return <Repeat className="w-5 h-5" />;
      default:
        return <Repeat className="w-5 h-5 opacity-50" />;
    }
  };

  if (!nashid) return null;

  const isFavorite = favorites.includes(nashid.id);

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg max-w-sm">
        <div className="flex items-center space-x-3">
          <img
            src={nashid.cover}
            alt={nashid.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{nashid.title}</h4>
            <p className="text-sm text-gray-600 truncate">{nashid.artist}</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePlayPause();
            }}
            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleMinimize();
            }}
            className="p-2 text-gray-600 hover:text-gray-900 active:text-black transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title="Развернуть"
          >
            <Minimize2 className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-gray-600 hover:text-red-600 active:text-red-700 transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title="Закрыть"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-6 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Аудиоплеер</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMinimize();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 active:text-black transition-colors touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              title="Свернуть"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 active:text-red-600 transition-colors touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Album Art */}
        <div className="text-center mb-6">
          <img
            src={nashid.cover}
            alt={nashid.title}
            className="w-64 h-64 mx-auto rounded-2xl object-cover shadow-lg"
          />
        </div>

        {/* Track Info */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{nashid.title}</h3>
          {nashid.titleTransliteration && (
            <p className="text-gray-600 mb-1">{nashid.titleTransliteration}</p>
          )}
          <p className="text-lg text-gray-700">{nashid.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-100"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <button
            onClick={toggleShuffle}
            className={`p-3 rounded-full transition-colors ${
              isShuffled
                ? 'bg-green-100 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Перемешать"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={handlePrevious}
            disabled={playlist.length === 0}
            className="p-3 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            title="Предыдущий"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePlayPause();
            }}
            disabled={isLoading}
            className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={playlist.length === 0}
            className="p-3 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            title="Следующий"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-3 rounded-full transition-colors ${
              repeatMode !== 'none'
                ? 'bg-green-100 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Повтор"
          >
            {getRepeatIcon()}
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleFavorite}
            className={`p-3 rounded-full transition-colors ${
              isFavorite
                ? 'bg-red-100 text-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Добавить в избранное"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            className={`p-3 rounded-full transition-colors ${
              isOfflineAvailable
                ? 'bg-green-100 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={isOfflineAvailable ? 'Доступно офлайн' : 'Скачать для офлайн'}
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={handleShare}
            className="p-3 text-gray-600 hover:text-gray-900 transition-colors rounded-full"
            title="Поделиться"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`p-3 rounded-full transition-colors ${
              showPlaylist
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Показать плейлист"
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist */}
        {showPlaylist && playlist.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Плейлист</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {playlist.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => dispatch(playNashid(item))}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    item.id === nashid.id
                      ? 'bg-green-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">{item.title}</h5>
                    <p className="text-sm text-gray-600 truncate">{item.artist}</p>
                  </div>
                  <span className="text-sm text-gray-500">{item.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <audio ref={audioRef} src={nashid.audioUrl} preload="auto" />
      </div>
    </div>
  );
};

export default AudioPlayer;