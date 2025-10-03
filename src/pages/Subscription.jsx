import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Star, BookOpen, Sparkles, Zap, Users, Clock, Download, Heart, Music, Book } from 'lucide-react';
import {
  selectCurrentSubscription,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_CONFIG,
  setSubscription
} from '../store/slices/subscriptionSlice';

const Subscription = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentSubscription = useSelector(selectCurrentSubscription);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // monthly, yearly

  const tiers = [
    {
      id: SUBSCRIPTION_TIERS.BASIC,
      config: SUBSCRIPTION_CONFIG[SUBSCRIPTION_TIERS.BASIC],
      icon: BookOpen,
      color: 'slate',
      gradient: 'from-slate-600 to-slate-700',
      price: { monthly: 0, yearly: 0 },
      popular: false
    },
    {
      id: SUBSCRIPTION_TIERS.PRO,
      config: SUBSCRIPTION_CONFIG[SUBSCRIPTION_TIERS.PRO],
      icon: Star,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-700',
      price: { monthly: 499, yearly: 4990 }, // ~416/месяц при годовой
      popular: true
    },
    {
      id: SUBSCRIPTION_TIERS.PREMIUM,
      config: SUBSCRIPTION_CONFIG[SUBSCRIPTION_TIERS.PREMIUM],
      icon: Crown,
      color: 'yellow',
      gradient: 'from-yellow-500 to-amber-600',
      price: { monthly: 999, yearly: 9990 }, // ~833/месяц при годовой
      popular: false
    }
  ];

  const handleSubscribe = (tierId, period) => {
    // В реальном приложении здесь будет интеграция с платежной системой
    const expiresAt = new Date();
    if (period === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    dispatch(setSubscription({
      tier: tierId,
      expiresAt: expiresAt.toISOString()
    }));

    // Перенаправляем на главную страницу
    navigate('/');
  };

  const getDiscount = (tier) => {
    if (selectedPeriod === 'yearly' && tier.price.yearly > 0) {
      const monthlyTotal = tier.price.monthly * 12;
      const discount = Math.round(((monthlyTotal - tier.price.yearly) / monthlyTotal) * 100);
      return discount;
    }
    return 0;
  };

  const getCurrentPrice = (tier) => {
    return selectedPeriod === 'yearly' ? tier.price.yearly : tier.price.monthly;
  };

  const getMonthlyEquivalent = (tier) => {
    if (selectedPeriod === 'yearly' && tier.price.yearly > 0) {
      return Math.round(tier.price.yearly / 12);
    }
    return tier.price.monthly;
  };

  return (
    <div className="min-h-screen py-4 sm:py-6 overflow-x-hidden relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white active:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Подписки</h1>
            <p className="text-white/70 text-sm sm:text-base">Выберите подходящий тариф</p>
          </div>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className={`bg-gradient-to-r ${
            currentSubscription.id === 'muslim' ? 'from-slate-700 to-slate-800' :
            currentSubscription.id === 'mutahsin' ? 'from-blue-600 to-indigo-700' :
            'from-yellow-500 to-amber-600'
          } rounded-2xl p-4 sm:p-6 mb-6 text-white`}>
            <div className="flex items-center gap-3 mb-2">
              {currentSubscription.id === 'muslim' && <BookOpen className="w-6 h-6" />}
              {currentSubscription.id === 'mutahsin' && <Star className="w-6 h-6" />}
              {currentSubscription.id === 'sahib_waqf' && <Crown className="w-6 h-6" />}
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Текущая подписка: {currentSubscription.name}</h2>
                <p className="text-white/80 text-sm">{currentSubscription.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Period Toggle */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 inline-flex">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === 'monthly'
                  ? 'bg-white text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all relative ${
                selectedPeriod === 'yearly'
                  ? 'bg-white text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Год
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentTier = currentSubscription?.id === tier.id;
            const discount = getDiscount(tier);
            const price = getCurrentPrice(tier);
            const monthlyPrice = getMonthlyEquivalent(tier);

            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl p-6 sm:p-8 transition-all ${
                  tier.popular ? 'ring-4 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'
                } ${isCurrentTier ? 'opacity-75' : ''}`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Популярный
                    </div>
                  </div>
                )}

                {/* Current Badge */}
                {isCurrentTier && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Текущий
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${tier.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.config.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{tier.config.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {price === 0 ? (
                    <div className="text-4xl font-bold text-gray-900">Бесплатно</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">{monthlyPrice}₽</span>
                        <span className="text-gray-600">/мес</span>
                      </div>
                      {selectedPeriod === 'yearly' && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">
                            {price}₽ в год
                          </span>
                          {discount > 0 && (
                            <span className="ml-2 text-sm font-semibold text-green-600">
                              Экономия {discount}%
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {/* Books */}
                  <div className="flex items-start gap-3">
                    <Book className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tier.config.features.books.access === 1 ? 'Полный каталог книг' : `${Math.floor(tier.config.features.books.access * 100)}% каталога`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {tier.config.features.books.offlineLimit === -1 ? 'Безлимитные' : `${tier.config.features.books.offlineLimit}`} офлайн
                      </p>
                    </div>
                  </div>

                  {/* Nashids */}
                  <div className="flex items-start gap-3">
                    <Music className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tier.config.features.nashids.count === -1 ? 'Все нашиды' : `${tier.config.features.nashids.count} нашидов`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {tier.config.features.nashids.offlineLimit === -1 ? 'Безлимитные' : `${tier.config.features.nashids.offlineLimit}`} офлайн
                      </p>
                    </div>
                  </div>

                  {/* Notes & Sync */}
                  {tier.config.features.features.notes && (
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">Заметки и синхронизация</p>
                    </div>
                  )}

                  {/* Background Audio */}
                  {tier.config.features.features.backgroundAudio && (
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">Фоновое воспроизведение</p>
                    </div>
                  )}

                  {/* AI Assistant */}
                  {tier.config.features.features.aiAssistant && (
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900">AI-помощник</p>
                    </div>
                  )}

                  {/* Family Access */}
                  {tier.config.features.features.familyAccess > 0 && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900">
                        Семейный доступ ({tier.config.features.features.familyAccess} профиля)
                      </p>
                    </div>
                  )}

                  {/* Early Access */}
                  {tier.config.features.features.earlyAccess && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">Ранний доступ к новинкам</p>
                    </div>
                  )}

                  {/* Exclusive Content */}
                  {tier.config.features.features.exclusiveContent && (
                    <div className="flex items-start gap-3">
                      <Crown className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">Эксклюзивный контент</p>
                    </div>
                  )}

                  {/* Export */}
                  {tier.config.features.features.export && (
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">Экспорт заметок в PDF</p>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(tier.id, selectedPeriod)}
                  disabled={isCurrentTier}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    isCurrentTier
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : tier.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-lg active:scale-95'
                      : `bg-gradient-to-r ${tier.gradient} text-white hover:shadow-lg active:scale-95`
                  }`}
                >
                  {isCurrentTier ? 'Текущий тариф' : price === 0 ? 'Текущий план' : 'Выбрать тариф'}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-20">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Часто задаваемые вопросы</h2>

          <div className="space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white font-medium p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <span>Можно ли отменить подписку в любой момент?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-2 p-4 text-white/80 text-sm">
                Да, вы можете отменить подписку в любой момент. Доступ к премиум-функциям сохранится до конца оплаченного периода.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white font-medium p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <span>Что происходит при смене тарифа?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-2 p-4 text-white/80 text-sm">
                При повышении тарифа новые функции становятся доступны сразу. При понижении - текущий тариф действует до конца оплаченного периода.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white font-medium p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <span>Есть ли пробный период?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-2 p-4 text-white/80 text-sm">
                Да, мы предоставляем 7 дней бесплатного доступа к тарифу Мутахсин (PRO) для новых пользователей.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white font-medium p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <span>Как работает семейный доступ?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-2 p-4 text-white/80 text-sm">
                С тарифом Сахиб аль-Вакф (Premium) вы можете пригласить до 3 членов семьи, каждый получит полный доступ ко всем функциям Premium.
              </div>
            </details>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default Subscription;
