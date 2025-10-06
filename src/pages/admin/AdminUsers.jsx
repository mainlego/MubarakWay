import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Crown,
  Star,
  Shield,
  Calendar,
  Clock,
  BookOpen,
  Music,
  Heart,
  Download,
  Edit,
  X,
  Save
} from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    premium: 0,
    conversion: 0
  });

  // Subscription modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [subFormData, setSubFormData] = useState({
    tier: 'muslim',
    expiresAt: ''
  });

  const subscriptionTiers = [
    { value: '', label: 'Все подписки' },
    { value: 'muslim', label: 'Muslim (Free)' },
    { value: 'mutahsin', label: 'Mutahsin (Pro)' },
    { value: 'sahib', label: 'Sahib (Premium)' }
  ];

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, subscriptionFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(subscriptionFilter && { subscription: subscriptionFilter })
      });

      const response = await axios.get(
        `${API_URL}/api/admin/users?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await axios.get(
        `${API_URL}/api/admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const { totalUsers, activeUsers, premiumUsers } = response.data.stats;
        setStats({
          total: totalUsers,
          active: activeUsers,
          premium: premiumUsers,
          conversion: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubscriptionBadge = (tier) => {
    switch (tier) {
      case 'sahib':
        return {
          label: 'Sahib',
          icon: <Crown className="w-3 h-3" />,
          className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        };
      case 'mutahsin':
        return {
          label: 'Mutahsin',
          icon: <Star className="w-3 h-3" />,
          className: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      default:
        return {
          label: 'Muslim',
          icon: <Shield className="w-3 h-3" />,
          className: 'bg-green-500/20 text-green-300 border-green-500/30'
        };
    }
  };

  const handleOpenSubModal = (user) => {
    setEditingUser(user);

    // Set default expiration (30 days from now)
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    const expiryString = defaultExpiry.toISOString().split('T')[0];

    setSubFormData({
      tier: user.subscription.tier || 'muslim',
      expiresAt: user.subscription.expiresAt
        ? new Date(user.subscription.expiresAt).toISOString().split('T')[0]
        : expiryString
    });
    setShowSubModal(true);
  };

  const handleCloseSubModal = () => {
    setShowSubModal(false);
    setEditingUser(null);
  };

  const handleSubInputChange = (e) => {
    const { name, value } = e.target;
    setSubFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      await axios.patch(
        `${API_URL}/api/admin/users/${editingUser._id}/subscription`,
        subFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleCloseSubModal();
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert('Ошибка при изменении подписки');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Управление пользователями
        </h1>
        <p className="text-white/60">
          Просмотр статистики и управление пользователями приложения
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-400/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-300" />
            </div>
            <h3 className="text-white/80 text-sm font-medium">Всего пользователей</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-400/20 rounded-lg">
              <Clock className="w-6 h-6 text-green-300" />
            </div>
            <h3 className="text-white/80 text-sm font-medium">Активные (30 дней)</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.active.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-400/20 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <h3 className="text-white/80 text-sm font-medium">Premium подписок</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.premium.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-400/20 rounded-lg">
              <Star className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-white/80 text-sm font-medium">Конверсия в Premium</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.conversion}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Поиск по имени, username, ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Subscription Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={subscriptionFilter}
              onChange={(e) => {
                setSubscriptionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-400 appearance-none"
            >
              {subscriptionTiers.map(tier => (
                <option key={tier.value} value={tier.value} className="bg-slate-800">
                  {tier.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin mb-4"></div>
            <p className="text-white/60">Загрузка пользователей...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Пользователи не найдены</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Пользователь</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Подписка</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Активность</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Статистика</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Регистрация</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => {
                    const badge = getSubscriptionBadge(user.subscription.tier);
                    return (
                      <tr key={user._id} className="hover:bg-white/5 transition-colors">
                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-white/50 text-sm">
                              @{user.username || 'no_username'} • ID: {user.telegramId}
                            </p>
                          </div>
                        </td>

                        {/* Subscription */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
                              {badge.icon}
                              {badge.label}
                            </span>
                            {user.subscription.isActive && user.subscription.tier !== 'muslim' && (
                              <span className="text-xs text-white/40">
                                до {formatDate(user.subscription.expiresAt)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Activity */}
                        <td className="px-6 py-4">
                          <p className="text-white/80 text-sm">
                            {formatDateTime(user.lastActive)}
                          </p>
                        </td>

                        {/* Stats */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-3 text-xs text-white/60">
                            <div className="flex items-center gap-1" title="Книги (избранное / офлайн)">
                              <BookOpen className="w-3 h-3" />
                              <span>{user.favorites?.books?.length || 0} / {user.offline?.books?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Нашиды (избранное / офлайн)">
                              <Music className="w-3 h-3" />
                              <span>{user.favorites?.nashids?.length || 0} / {user.offline?.nashids?.length || 0}</span>
                            </div>
                          </div>
                        </td>

                        {/* Registration Date */}
                        <td className="px-6 py-4">
                          <p className="text-white/80 text-sm">
                            {formatDate(user.createdAt)}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenSubModal(user)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Изменить подписку"
                            >
                              <Edit className="w-4 h-4 text-emerald-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                <p className="text-white/60 text-sm">
                  Страница {currentPage} из {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-white/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                Изменить подписку
              </h2>
              <button
                onClick={handleCloseSubModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateSubscription} className="p-6 space-y-4">
              {/* User Info */}
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-white font-medium">
                  {editingUser.firstName} {editingUser.lastName}
                </p>
                <p className="text-white/50 text-sm">
                  @{editingUser.username || 'no_username'} • ID: {editingUser.telegramId}
                </p>
              </div>

              {/* Subscription Tier */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Тип подписки *
                </label>
                <select
                  name="tier"
                  value={subFormData.tier}
                  onChange={handleSubInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="muslim" className="bg-slate-800">Muslim (Бесплатно)</option>
                  <option value="mutahsin" className="bg-slate-800">Mutahsin (Pro)</option>
                  <option value="sahib" className="bg-slate-800">Sahib (Premium)</option>
                </select>
              </div>

              {/* Expiration Date (only for paid tiers) */}
              {(subFormData.tier === 'mutahsin' || subFormData.tier === 'sahib') && (
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Действует до
                  </label>
                  <input
                    type="date"
                    name="expiresAt"
                    value={subFormData.expiresAt}
                    onChange={handleSubInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    Если не указано, будет установлено +30 дней от сегодня
                  </p>
                </div>
              )}

              {/* Info message for free tier */}
              {subFormData.tier === 'muslim' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    Бесплатная подписка не имеет срока действия
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseSubModal}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all"
                >
                  <Save className="w-4 h-4" />
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
