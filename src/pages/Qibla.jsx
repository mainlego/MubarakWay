import React, { useState } from 'react';
import QiblaCompass from '../components/QiblaCompass';
import { useSelector } from 'react-redux';
import { Navigation, Map, Clock, Settings } from 'lucide-react';

const Qibla = () => {
  const [activeTab, setActiveTab] = useState('compass');
  const { prayerTimes, userLocation } = useSelector(state => state.qibla);

  const prayers = [
    { name: 'Фаджр', time: '05:30', next: false },
    { name: 'Восход', time: '07:45', next: false },
    { name: 'Зухр', time: '13:20', next: true },
    { name: 'Аср', time: '16:45', next: false },
    { name: 'Магриб', time: '19:30', next: false },
    { name: 'Иша', time: '21:15', next: false },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-6"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/src/assets/images/background_nashidi_2.jpg)'
      }}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-white text-center mb-6">Кибла и намаз</h1>

        {/* Tab Navigation */}
        <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1 mb-6">
          {[
            { id: 'compass', label: 'Компас', icon: Navigation },
            { id: 'map', label: 'Карта', icon: Map },
            { id: 'times', label: 'Время', icon: Clock }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          {activeTab === 'compass' && (
            <div>
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Интерактивный компас
              </h2>
              <QiblaCompass />
              <p className="text-white/80 text-sm text-center mt-4">
                Поверните устройство для точного направления
              </p>
            </div>
          )}

          {activeTab === 'map' && (
            <div>
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Карта направления
              </h2>
              <div className="aspect-square bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <Map className="w-12 h-12 mx-auto mb-2 opacity-60" />
                  <p className="text-sm">Интеграция с картографическим сервисом</p>
                  <p className="text-xs opacity-80 mt-1">Отображение окружающих объектов</p>
                </div>
              </div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                Переключить провайдер карт
              </button>
            </div>
          )}

          {activeTab === 'times' && (
            <div>
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Время молитв
              </h2>

              {/* Prayer Times List */}
              <div className="space-y-3 mb-6">
                {prayers.map((prayer, index) => (
                  <div
                    key={prayer.name}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      prayer.next
                        ? 'bg-green-600/30 border border-green-500/50'
                        : 'bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">{prayer.name}</div>
                      {prayer.next && (
                        <div className="text-green-300 text-xs">Следующая молитва</div>
                      )}
                    </div>
                    <div className="text-white font-mono text-lg">{prayer.time}</div>
                  </div>
                ))}
              </div>

              {/* Next Prayer Countdown */}
              <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="text-green-300 text-sm mb-1">До следующей молитвы</div>
                <div className="text-white text-2xl font-bold">2ч 35м</div>
              </div>

              {/* Settings */}
              <button className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Настройки расчета</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-white/60 text-xs">
          {userLocation ? (
            <p>Расчет основан на вашем местоположении</p>
          ) : (
            <p>Разрешите доступ к геолокации для точных расчетов</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Qibla;