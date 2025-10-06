import React from 'react';
import { Music, Plus } from 'lucide-react';

const AdminNashids = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Управление нашидами
          </h1>
          <p className="text-white/60">
            Добавление, редактирование и удаление нашидов
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg">
          <Plus className="w-5 h-5" />
          Добавить нашид
        </button>
      </div>

      {/* Coming Soon */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 text-center">
        <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          В разработке
        </h2>
        <p className="text-white/60">
          CRUD интерфейс для нашидов будет добавлен в следующем обновлении
        </p>
      </div>
    </div>
  );
};

export default AdminNashids;
