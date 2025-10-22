import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdminApiUrl } from '../../utils/apiConfig';
import {
  BarChart3,
  BookOpen,
  Music,
  Users,
  TrendingUp,
  Crown,
  Clock,
  Activity
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const API_URL = getAdminApiUrl();
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('❌ Stats error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        navigate('/admin/login');
      } else {
        setError('Не удалось загрузить статистику');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 max-w-md">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Всего книг',
      value: stats?.totalBooks || 0,
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      title: 'Всего нашидов',
      value: stats?.totalNashids || 0,
      icon: Music,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      title: 'Всего пользователей',
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/20 to-emerald-500/20'
    },
    {
      title: 'Активные пользователи',
      value: stats?.activeUsers || 0,
      icon: Activity,
      gradient: 'from-orange-500 to-yellow-500',
      bgGradient: 'from-orange-500/20 to-yellow-500/20',
      subtitle: 'За последние 30 дней'
    },
    {
      title: 'Premium подписки',
      value: stats?.premiumUsers || 0,
      icon: Crown,
      gradient: 'from-yellow-500 to-amber-500',
      bgGradient: 'from-yellow-500/20 to-amber-500/20'
    },
    {
      title: 'Конверсия',
      value: stats?.totalUsers > 0
        ? `${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}%`
        : '0%',
      icon: TrendingUp,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-500/20 to-rose-500/20',
      subtitle: 'Free → Premium'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Панель управления
        </h1>
        <p className="text-white/60">
          Обзор статистики и активности MubarakWay
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient}`}>
                  <Icon className={`w-6 h-6 text-white`} />
                </div>
              </div>

              <div>
                <p className="text-white/60 text-sm mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {card.value.toLocaleString()}
                </p>
                {card.subtitle && (
                  <p className="text-white/40 text-xs">{card.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Users */}
      {stats?.recentUsers && stats.recentUsers.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Недавние пользователи
            </h2>
          </div>

          <div className="space-y-3">
            {stats.recentUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-white/50 text-sm">
                      ID: {user.telegramId}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.subscription?.tier === 'sahib'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : user.subscription?.tier === 'mutahsin'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {user.subscription?.tier === 'sahib' && <Crown className="w-3 h-3" />}
                    {user.subscription?.tier === 'sahib'
                      ? 'Premium'
                      : user.subscription?.tier === 'mutahsin'
                      ? 'Pro'
                      : 'Free'}
                  </div>
                  <p className="text-white/40 text-xs mt-1">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/admin/books')}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 transition-all text-left group"
        >
          <BookOpen className="w-8 h-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-2">Управление книгами</h3>
          <p className="text-white/60 text-sm">
            Добавление, редактирование и удаление книг
          </p>
        </button>

        <button
          onClick={() => navigate('/admin/nashids')}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 transition-all text-left group"
        >
          <Music className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-2">Управление нашидами</h3>
          <p className="text-white/60 text-sm">
            Добавление, редактирование и удаление нашидов
          </p>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
