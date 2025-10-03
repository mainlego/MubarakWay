import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNashids, playNashid } from '../store/slices/nashidsSlice';
import NashidCard from '../components/NashidCard';
import { ArrowLeft, Folder, Mic, Moon, Play, Heart, Download } from 'lucide-react';
import { getBackgroundWithOverlay } from '../utils/backgrounds';
import { useOffline } from '../hooks/useOffline';

const Nashids = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { nashids, loading, currentPlaying, favorites } = useSelector(state => state.nashids);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const { isOnline } = useOffline();

  useEffect(() => {
    dispatch(fetchNashids());
    setBackgroundStyle(getBackgroundWithOverlay('nashids', 0.4));
  }, [dispatch]);

  const categories = [
    { id: 'all', name: 'Все', icon: Folder },
    { id: 'spiritual', name: 'Духовные', icon: Folder },
    { id: 'family', name: 'Семейные', icon: Mic },
    { id: 'gratitude', name: 'Благодарность', icon: Moon },
    { id: 'prophetic', name: 'О Пророке ﷺ', icon: Moon }
  ];

  const filteredNashids = selectedCategory === 'all'
    ? nashids
    : nashids.filter(nashid => nashid.category === selectedCategory);

  const favoriteNashids = nashids.filter(nashid => favorites.includes(nashid.id));

  const handlePlayNashid = (nashid) => {
    dispatch(playNashid(nashid));
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка нашидов...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6 min-h-screen overflow-x-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
        animation: 'nashidsGradient 15s ease infinite'
      }}
    >
      {/* Animated Background */}
      <style>{`
        @keyframes nashidsGradient {
          0%, 100% {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
          }
          50% {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
          }
        }
        @keyframes musicWave {
          0%, 100% { transform: translateY(0px) scaleY(1); opacity: 0.1; }
          50% { transform: translateY(-15px) scaleY(1.2); opacity: 0.2; }
        }
      `}</style>

      {/* Floating music notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/10 text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `musicWave ${6 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          >
            {i % 2 === 0 ? '♪' : '♫'}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white active:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Нашиды</h1>
          </div>
          <button className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white active:bg-white/30 transition-colors">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28l-2.64-2.64-1.42 1.42L12 15.12l4.06-4.06-1.42-1.42L12 12.28V3z"/>
              <path d="M19 17v2H5v-2h14z"/>
            </svg>
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-4 text-center">
            <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white mx-auto mb-1 sm:mb-2" />
            <p className="text-white font-semibold text-sm sm:text-base">{nashids.length}</p>
            <p className="text-white/80 text-xs sm:text-sm">Нашидов</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-4 text-center">
            <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white mx-auto mb-1 sm:mb-2" />
            <p className="text-white font-semibold text-sm sm:text-base">{favoriteNashids.length}</p>
            <p className="text-white/80 text-xs sm:text-sm">Избранных</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-4 text-center">
            <Download className="w-4 h-4 sm:w-6 sm:h-6 text-white mx-auto mb-1 sm:mb-2" />
            <p className="text-white font-semibold text-sm sm:text-base">0</p>
            <p className="text-white/80 text-xs sm:text-sm">Офлайн</p>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white/30 backdrop-blur-sm border border-white/20'
                    : 'bg-white/10 backdrop-blur-sm active:bg-white/20'
                }`}
              >
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                <span className="text-white font-medium text-xs sm:text-sm truncate">{category.name}</span>
              </button>
            );
          })}

          {/* Избранное */}
          <button
            onClick={() => setSelectedCategory('favorites')}
            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl transition-all ${
              selectedCategory === 'favorites'
                ? 'bg-white/30 backdrop-blur-sm border border-white/20'
                : 'bg-white/10 backdrop-blur-sm active:bg-white/20'
            }`}
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
            <span className="text-white font-medium text-xs sm:text-sm truncate">Избранное ({favoriteNashids.length})</span>
          </button>
        </div>

        {/* Nashids List */}
        <div className="space-y-3 sm:space-y-4 w-full">
          {selectedCategory === 'favorites' ? (
            favoriteNashids.length > 0 ? (
              favoriteNashids.map(nashid => (
                <NashidCard key={nashid.id} nashid={nashid} onPlay={handlePlayNashid} />
              ))
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-white/50 mx-auto mb-4" />
                <p className="text-white/80 text-lg">Нет избранных нашидов</p>
                <p className="text-white/60 text-sm">Добавьте нашиды в избранное, нажав на сердечко</p>
              </div>
            )
          ) : filteredNashids.length > 0 ? (
            filteredNashids.map(nashid => (
              <NashidCard key={nashid.id} nashid={nashid} onPlay={handlePlayNashid} />
            ))
          ) : (
            <div className="text-center py-12">
              <Mic className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/80 text-lg">Нашиды не найдены</p>
            </div>
          )}
        </div>

        {/* Статус сети */}
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-xl w-full mb-20">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <p className="text-white text-xs sm:text-sm text-center">
              {isOnline
                ? 'Подключено к интернету - стриминг доступен'
                : 'Офлайн режим - доступны только скачанные нашиды'
              }
            </p>
          </div>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default Nashids;