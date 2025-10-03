import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNashids, playNashid } from '../store/slices/nashidsSlice';
import NashidCard from '../components/NashidCard';
import { ArrowLeft, Folder, Mic, Moon, Play, Heart, Download } from 'lucide-react';
import { getBackgroundWithOverlay } from '../utils/backgrounds';
import { useOffline } from '../hooks/useOffline';
import {
  selectCurrentSubscription,
  selectCanAddFavoriteNashid,
  selectCanAddOfflineNashid,
  selectRemainingOfflineNashids,
  selectRemainingFavoriteNashids
} from '../store/slices/subscriptionSlice';

const Nashids = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { nashids, loading, currentPlaying, favorites } = useSelector(state => state.nashids);
  const subscriptionConfig = useSelector(selectCurrentSubscription);
  const canAddFavorite = useSelector(selectCanAddFavoriteNashid);
  const canAddOffline = useSelector(selectCanAddOfflineNashid);
  const remainingOffline = useSelector(selectRemainingOfflineNashids);
  const remainingFavorites = useSelector(selectRemainingFavoriteNashids);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [showFilters, setShowFilters] = useState(true);
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

  // Apply subscription limits for nashids count
  const availableNashids = subscriptionConfig.features.nashids.count === -1
    ? nashids
    : nashids.slice(0, subscriptionConfig.features.nashids.count);

  // Apply category limit for Basic tier
  const filterNashidsByCategory = (categoryNashids) => {
    if (subscriptionConfig.features.nashids.perCategory === -1) {
      return categoryNashids;
    }
    return categoryNashids.slice(0, subscriptionConfig.features.nashids.perCategory);
  };

  const filteredNashids = selectedCategory === 'all'
    ? availableNashids
    : filterNashidsByCategory(availableNashids.filter(nashid => nashid.category === selectedCategory));

  const favoriteNashids = availableNashids.filter(nashid => favorites.includes(nashid.id));

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
    <div className="py-4 sm:py-6 min-h-screen overflow-x-hidden relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Audio waveform pattern background */}
      <style>{`
        @keyframes waveMove {
          0%, 100% { transform: translateX(0); opacity: 0.06; }
          50% { transform: translateX(-20px); opacity: 0.12; }
        }
        @keyframes soundPulse {
          0%, 100% { transform: scaleY(0.5); opacity: 0.05; }
          50% { transform: scaleY(1); opacity: 0.1; }
        }
        .nashids-pattern {
          background-image:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 10px,
              rgba(59,130,246,.04) 10px,
              rgba(59,130,246,.04) 12px,
              transparent 12px,
              transparent 20px,
              rgba(99,102,241,.04) 20px,
              rgba(99,102,241,.04) 23px
            );
          animation: waveMove 6s linear infinite;
        }
      `}</style>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 nashids-pattern pointer-events-none"></div>

      {/* Vertical sound bars effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 bg-blue-500/10 rounded-t-lg"
            style={{
              left: `${i * 7}%`,
              width: '20px',
              height: `${30 + Math.random() * 40}%`,
              animation: `soundPulse ${1.5 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Soft glowing orbs */}
      <div className="absolute top-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 -left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white active:bg-white/30 transition-all"
          >
            <svg
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${showFilters ? '' : 'rotate-180'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v9.28l-2.64-2.64-1.42 1.42L12 15.12l4.06-4.06-1.42-1.42L12 12.28V3z"/>
              <path d="M19 17v2H5v-2h14z"/>
            </svg>
          </button>
        </div>

        {/* Статистика и Categories - свернуты */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            showFilters ? 'max-h-[1000px] opacity-100 mb-4 sm:mb-6' : 'max-h-0 opacity-0 mb-0'
          }`}
        >
          {/* Subscription Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                {subscriptionConfig.id === 'muslim' && '📚'}
                {subscriptionConfig.id === 'mutahsin' && '⭐'}
                {subscriptionConfig.id === 'sahib_waqf' && '👑'}
                {subscriptionConfig.name}
              </h3>
            </div>

            {/* Limits display */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 text-center">
                <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white mx-auto mb-1" />
                <p className="text-sm sm:text-base font-bold text-white">
                  {subscriptionConfig.features.nashids.count === -1 ? '∞' : `${availableNashids.length}/${nashids.length}`}
                </p>
                <p className="text-white/70 text-xs">Нашидов</p>
              </div>

              <div className="bg-white/10 rounded-lg p-2 sm:p-3 text-center">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-white mx-auto mb-1" />
                <p className="text-sm sm:text-base font-bold text-white">
                  {remainingOffline === -1 ? '∞' : remainingOffline}
                </p>
                <p className="text-white/70 text-xs">Офлайн</p>
              </div>

              <div className="bg-white/10 rounded-lg p-2 sm:p-3 text-center">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white mx-auto mb-1" />
                <p className="text-sm sm:text-base font-bold text-white">
                  {remainingFavorites === -1 ? '∞' : remainingFavorites}
                </p>
                <p className="text-white/70 text-xs">Избранное</p>
              </div>
            </div>

            {/* Warnings for Basic tier */}
            {subscriptionConfig.id === 'muslim' && (
              <div className="mt-3 p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <p className="text-xs text-yellow-100">
                  ⚠️ Муслим: {subscriptionConfig.features.nashids.count} нашидов, по {subscriptionConfig.features.nashids.perCategory} в категории
                </p>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 w-full">
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

        {/* Upgrade Banner for Basic */}
        {subscriptionConfig.id === 'muslim' && (
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white w-full">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Улучшите подписку!</h3>
            <p className="text-blue-100 text-xs sm:text-sm mb-3">
              <strong>Мутахсин (PRO):</strong> Все нашиды, неограниченные офлайн и избранное, фоновое воспроизведение<br/>
              <strong>Сахиб аль-Вакф (Premium):</strong> Всё из PRO + AI-рекомендации и эксклюзивный контент
            </p>
            <button className="bg-white text-blue-600 px-4 sm:px-6 py-2 rounded-lg text-sm font-medium active:bg-blue-50 transition-colors">
              Улучшить подписку
            </button>
          </div>
        )}

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