import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { pauseNashid } from '../store/slices/nashidsSlice';

/**
 * Глобальный хук для управления единственным аудио элементом
 * Этот хук должен использоваться ОДИН РАЗ на верхнем уровне приложения
 */
export const useGlobalAudio = () => {
  const dispatch = useDispatch();
  const { currentPlaying, isPlaying } = useSelector(state => state.nashids);

  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // Получаем правильный URL для аудио
  const getAudioUrl = (nashidItem) => {
    return nashidItem?.audioUrl || nashidItem?.audio_url || '';
  };

  // Инициализация аудио элемента
  useEffect(() => {
    // Создаём единственный глобальный аудио элемент
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;

      console.log('Global audio element created');
    }

    const audio = audioRef.current;

    // Обработчики событий
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setAudioError(null);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    const handleError = (e) => {
      console.error('Global audio error:', e.target.error);
      setIsLoading(false);
      setAudioError(`Ошибка загрузки аудио: ${e.target.error?.message || 'Неизвестная ошибка'}`);
      dispatch(pauseNashid());
    };

    // Подписываемся на события
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
    };
  }, [dispatch]);

  // Управление воспроизведением на основе Redux state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentPlaying) return;

    const audioUrl = getAudioUrl(currentPlaying);
    if (!audioUrl) {
      setAudioError('URL аудио не найден');
      return;
    }

    // Устанавливаем источник только если он изменился
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${window.location.origin}${audioUrl}`;

    console.log('Global Audio URL:', audioUrl);
    console.log('Global Full Audio URL:', fullAudioUrl);

    if (audio.src !== fullAudioUrl) {
      audio.src = fullAudioUrl;
      audio.load();
    }

    // Управляем воспроизведением
    if (isPlaying && audio.paused) {
      console.log('Global audio: Starting playback...');
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Global audio: Playback started successfully');
            setAudioError(null);
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Global audio: Playback error:', error);
            setAudioError(`Не удалось воспроизвести аудио: ${error.message}`);
            setIsLoading(false);
            dispatch(pauseNashid());
          });
      }
    } else if (!isPlaying && !audio.paused) {
      console.log('Global audio: Pausing...');
      audio.pause();
    }
  }, [isPlaying, currentPlaying, dispatch]);

  // Media Session API для фонового воспроизведения
  useEffect(() => {
    if ('mediaSession' in navigator && currentPlaying) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentPlaying.title,
          artist: currentPlaying.artist,
          album: 'Islamic Nashids',
          artwork: currentPlaying.cover ? [
            { src: currentPlaying.cover, sizes: '512x512', type: 'image/jpeg' }
          ] : []
        });

        // Обновляем позицию воспроизведения
        if (duration > 0 && currentTime >= 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: duration,
              playbackRate: 1,
              position: Math.min(currentTime, duration)
            });
          } catch (error) {
            console.warn('Failed to set position state:', error);
          }
        }
      } catch (error) {
        console.warn('Media Session API error:', error);
      }
    }
  }, [currentPlaying, currentTime, duration]);

  // Возвращаем API для управления аудио
  return {
    audioRef,
    currentTime,
    duration,
    isLoading,
    audioError,
    setCurrentTime: (time) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
    },
    setVolume: (volume) => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    }
  };
};