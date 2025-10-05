import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, User, Bell, Globe, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { selectUser } from '../store/slices/authSlice';
import { logout } from '../store/slices/authSlice';

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  // Local state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.prayerSettings?.notifications?.enabled || false
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.languageCode || 'ru'
  );

  const handleLogout = () => {
    // Очищаем Redux state
    dispatch(logout());

    // Очищаем localStorage (кроме onboarding)
    const onboarding = localStorage.getItem('onboarding_completed');
    localStorage.clear();
    if (onboarding) {
      localStorage.setItem('onboarding_completed', onboarding);
    }

    // Перенаправляем на главную (покажется экран входа)
    navigate('/');

    // Перезагружаем страницу для сброса состояния
    window.location.reload();
  };

  const handleNotificationsToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    // TODO: Save to backend
    console.log('Notifications:', newValue ? 'enabled' : 'disabled');
  };

  const handleLanguageChange = () => {
    // Cycle through languages: ru -> en -> ar -> ru
    const languages = { ru: 'en', en: 'ar', ar: 'ru' };
    const newLang = languages[selectedLanguage];
    setSelectedLanguage(newLang);
    // TODO: Save to backend and apply i18n
    console.log('Language changed to:', newLang);
  };

  const getLanguageLabel = (code) => {
    const labels = { ru: 'Русский', en: 'English', ar: 'العربية' };
    return labels[code] || 'Русский';
  };

  const settingsSections = [
    {
      title: 'Профиль',
      items: [
        {
          icon: User,
          label: 'Личные данные',
          description: 'Имя, фото профиля',
          onClick: () => alert('Функция редактирования профиля будет добавлена')
        },
        {
          icon: CreditCard,
          label: 'Подписка',
          description: user?.subscription?.tier === 'muslim' ? 'Муслим (Бесплатно)' :
                       user?.subscription?.tier === 'mutahsin' ? 'Мутахсин (PRO)' :
                       'Сахиб аль-Вакф (Premium)',
          onClick: () => navigate('/subscription')
        }
      ]
    },
    {
      title: 'Настройки приложения',
      items: [
        {
          icon: Bell,
          label: 'Уведомления',
          description: notificationsEnabled ? 'Включены' : 'Выключены',
          onClick: handleNotificationsToggle,
          showToggle: true,
          toggleValue: notificationsEnabled
        },
        {
          icon: Globe,
          label: 'Язык',
          description: getLanguageLabel(selectedLanguage),
          onClick: handleLanguageChange
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 pt-16 pb-20">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Настройки</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* User Info Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {user?.firstName?.charAt(0)?.toUpperCase() || 'G'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">
                {user?.firstName || 'Гость'}
              </h2>
              <p className="text-sm text-white/60">
                Telegram ID: {user?.telegramId || 'Не авторизован'}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            <h3 className="text-sm font-medium text-white/60 px-2">
              {section.title}
            </h3>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={itemIndex}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation border-b border-white/10 last:border-b-0"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="p-2 bg-white/10 rounded-lg">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.label}</div>
                      <div className="text-sm text-white/60">{item.description}</div>
                    </div>
                    {item.showToggle ? (
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${
                          item.toggleValue ? 'bg-green-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                            item.toggleValue ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`}
                        />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 backdrop-blur-sm rounded-2xl text-red-300 font-medium transition-colors touch-manipulation border border-red-500/30"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <LogOut className="w-5 h-5" />
          Выйти из аккаунта
        </button>

        {/* App Version */}
        <div className="text-center text-white/40 text-xs">
          Mubarak Way v3.1.0
        </div>
      </div>
    </div>
  );
};

export default Settings;
