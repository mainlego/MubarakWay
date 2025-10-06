import React from 'react';
import { Users } from 'lucide-react';

const AdminUsers = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Управление пользователями
        </h1>
        <p className="text-white/60">
          Просмотр и управление пользователями приложения
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 text-center">
        <Users className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          В разработке
        </h2>
        <p className="text-white/60">
          Интерфейс управления пользователями будет добавлен в следующем обновлении
        </p>
      </div>
    </div>
  );
};

export default AdminUsers;
