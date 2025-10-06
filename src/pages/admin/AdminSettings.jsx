import React from 'react';
import { Settings } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Настройки системы
        </h1>
        <p className="text-white/60">
          Конфигурация и настройки приложения
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 text-center">
        <Settings className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          В разработке
        </h2>
        <p className="text-white/60">
          Настройки системы будут добавлены в следующем обновлении
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
