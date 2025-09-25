import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Music, Navigation2, Clock, Crown } from 'lucide-react';

const Home = () => {
  const features = [
    {
      title: 'Библиотека книг',
      description: 'Исламская литература с встроенной читалкой',
      icon: BookOpen,
      link: '/library',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Нашиды',
      description: 'Религиозные песнопения и плейлисты',
      icon: Music,
      link: '/nashids',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Направление киблы',
      description: 'Компас и время молитв',
      icon: Navigation2,
      link: '/qibla',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6"
    >
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">MubarakWay</h1>
          <p className="text-gray-600 text-lg">Ваш путь к исламскому знанию</p>
        </div>

        {/* Time Widget */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-gray-700 font-medium">Следующая молитва</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">Зухр</div>
          <div className="text-gray-600">через 2ч 35м</div>
        </div>

        {/* Features Grid */}
        <div className="space-y-4 mb-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.link}
                className="block"
              >
                <div className={`bg-gradient-to-r ${feature.gradient} rounded-2xl p-6 text-white transition-transform hover:scale-105`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                      <p className="text-white/90 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Daily Quote */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg">
          <h3 className="text-gray-800 font-semibold mb-3">Хадис дня</h3>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            "Поистине, Аллах не изменит положения людей, пока они не изменят самих себя."
          </p>
          <p className="text-gray-500 text-xs">Коран 13:11</p>
        </div>

        {/* Subscription Banner */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 text-center">
          <Crown className="w-8 h-8 text-white mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Откройте больше возможностей</h3>
          <p className="text-white/90 text-sm mb-4">
            200+ книг, эксклюзивные лекции и персональные уроки
          </p>
          <button className="bg-white text-yellow-600 px-6 py-2 rounded-xl font-medium hover:bg-yellow-50 transition-colors">
            Оформить подписку
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;