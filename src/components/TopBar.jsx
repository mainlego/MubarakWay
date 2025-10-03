import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Settings } from 'lucide-react';
import { selectUser } from '../store/slices/authSlice';

const TopBar = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  // Get Telegram user data
  const getTelegramUser = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return window.Telegram.WebApp.initDataUnsafe.user;
    }
    return null;
  };

  const telegramUser = getTelegramUser();
  const displayName = user?.firstName || telegramUser?.first_name || 'Гость';

  // Get avatar URL from Telegram
  const getAvatarUrl = () => {
    if (telegramUser?.photo_url) {
      return telegramUser.photo_url;
    }
    // Return default avatar placeholder
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 safe-top">
      <div className="flex items-center justify-between px-4 py-2">
        {/* User info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {displayName}
            </span>
            {user?.subscription?.tier && (
              <span className="text-[10px] text-gray-500">
                {user.subscription.tier === 'muslim' && 'Муслим'}
                {user.subscription.tier === 'mutahsin' && 'Мутахсин'}
                {user.subscription.tier === 'sahib_waqf' && 'Сахиб аль-Вакф'}
              </span>
            )}
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-800 active:bg-gray-100 transition-colors touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Настройки"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
