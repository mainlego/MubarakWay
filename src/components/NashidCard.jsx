import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Pause, Heart, Download } from 'lucide-react';
import { toggleFavorite, playNashid, pauseNashid } from '../store/slices/nashidsSlice';

const NashidCard = ({ nashid }) => {
  const dispatch = useDispatch();
  const { favorites, currentPlaying, isPlaying } = useSelector(state => state.nashids);

  const isFavorite = favorites.includes(nashid.id);
  const isCurrentPlaying = currentPlaying === nashid.id;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(nashid.id));
  };

  const handlePlayPause = () => {
    if (isCurrentPlaying && isPlaying) {
      dispatch(pauseNashid());
    } else {
      dispatch(playNashid(nashid.id));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 transition-transform hover:scale-105">
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={nashid.cover}
            alt={nashid.title}
            className="w-16 h-16 rounded-lg object-cover"
            onError={(e) => {
              e.target.src = '/src/assets/images/nashid-placeholder.jpg';
            }}
          />
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            {isCurrentPlaying && isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate" dir="rtl">{nashid.title}</h3>
          <p className="text-sm text-gray-600 truncate">{nashid.titleTransliteration}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">{nashid.artist}</p>
            <span className="text-xs text-gray-500">{nashid.duration}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            {isCurrentPlaying && isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <span className="text-xs text-green-600 font-medium">Слушать</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleFavoriteClick}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            isFavorite
              ? 'bg-red-50 text-red-600'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          <span className="text-xs">В избранное</span>
        </button>

        <button className="flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Download className="w-4 h-4" />
          <span className="text-xs">Скачать MP3</span>
        </button>
      </div>
    </div>
  );
};

export default NashidCard;