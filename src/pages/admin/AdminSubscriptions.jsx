import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdminApiUrl } from '../../utils/apiConfig';
import {
  CreditCard,
  Save,
  X,
  Edit,
  AlertCircle,
  CheckCircle,
  Infinity
} from 'lucide-react';

const AdminSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      const response = await axios.get(
        `${API_URL}/api/admin/subscriptions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSubscriptions(response.data.subscriptions);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subscription) => {
    setEditingTier(subscription.tier);
    setFormData({ ...subscription });
  };

  const handleCancel = () => {
    setEditingTier(null);
    setFormData(null);
  };

  const handleSave = async (tier) => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      await axios.put(
        `${API_URL}/api/admin/subscriptions/${tier}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaveStatus({
        show: true,
        success: true,
        message: 'Настройки подписки успешно сохранены'
      });

      setEditingTier(null);
      fetchSubscriptions();

      setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
    } catch (error) {
      console.error('Failed to save subscription:', error);
      setSaveStatus({
        show: true,
        success: false,
        message: error.response?.data?.message || 'Ошибка при сохранении'
      });
    }
  };

  const handleChange = (field, value) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setFormData({ ...formData, [field]: value });
    } else if (keys.length === 2) {
      setFormData({
        ...formData,
        [keys[0]]: {
          ...formData[keys[0]],
          [keys[1]]: value
        }
      });
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'muslim': return 'emerald';
      case 'mutahsin': return 'blue';
      case 'sahib': return 'purple';
      default: return 'gray';
    }
  };

  const renderLimitInput = (label, field, value) => {
    const isUnlimited = value === -1;
    const isEditing = editingTier !== null;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">{label}</label>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <input
                type="number"
                value={isUnlimited ? '' : value}
                onChange={(e) => handleChange(field, parseInt(e.target.value) || 0)}
                disabled={isUnlimited}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                placeholder={isUnlimited ? 'Безлимит' : '0'}
              />
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={isUnlimited}
                  onChange={(e) => handleChange(field, e.target.checked ? -1 : 0)}
                  className="w-4 h-4 rounded border-white/20"
                />
                <Infinity className="w-4 h-4" />
              </label>
            </>
          ) : (
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
              {isUnlimited ? (
                <span className="flex items-center gap-2">
                  <Infinity className="w-4 h-4" /> Безлимит
                </span>
              ) : (
                value
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8" />
            Управление подписками
          </h1>
          <p className="text-white/60 mt-1">
            Настройка тарифов и лимитов для пользователей
          </p>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus.show && (
        <div className={`p-4 rounded-xl border ${saveStatus.success
          ? 'bg-emerald-500/20 border-emerald-500/50'
          : 'bg-red-500/20 border-red-500/50'
          } flex items-center gap-3`}>
          {saveStatus.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <p className={saveStatus.success ? 'text-emerald-200' : 'text-red-200'}>
            {saveStatus.message}
          </p>
        </div>
      )}

      {/* Subscription Cards */}
      <div className="grid gap-6">
        {subscriptions.map((subscription) => {
          const isEditing = editingTier === subscription.tier;
          const data = isEditing ? formData : subscription;
          const color = getTierColor(subscription.tier);

          return (
            <div
              key={subscription.tier}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r from-${color}-500/20 to-${color}-600/20 border-b border-white/10 p-6`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{data.name}</h3>
                    <p className="text-white/60 mt-1">{data.description}</p>
                    {data.price.amount > 0 && (
                      <p className="text-white/80 mt-2 font-semibold">
                        {data.price.amount} {data.price.currency} / {
                          data.price.period === 'monthly' ? 'месяц' :
                          data.price.period === 'yearly' ? 'год' : 'навсегда'
                        }
                      </p>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleEdit(subscription)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-white/70" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Limits */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Лимиты</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderLimitInput('Книги офлайн', 'limits.booksOffline', data.limits.booksOffline)}
                    {renderLimitInput('Избранные книги', 'limits.booksFavorites', data.limits.booksFavorites)}
                    {renderLimitInput('Нашиды офлайн', 'limits.nashidsOffline', data.limits.nashidsOffline)}
                    {renderLimitInput('Избранные нашиды', 'limits.nashidsFavorites', data.limits.nashidsFavorites)}
                  </div>
                </div>

                {/* Access */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Доступ к контенту</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {['freeContent', 'proContent', 'premiumContent'].map((key) => (
                      <label key={key} className="flex items-center gap-2 text-white/70">
                        <input
                          type="checkbox"
                          checked={data.access[key]}
                          onChange={(e) => isEditing && handleChange(`access.${key}`, e.target.checked)}
                          disabled={!isEditing}
                          className="w-4 h-4 rounded border-white/20"
                        />
                        {key === 'freeContent' ? 'Бесплатный' :
                         key === 'proContent' ? 'Pro' : 'Premium'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Возможности</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries({
                      offlineMode: 'Офлайн режим',
                      adFree: 'Без рекламы',
                      prioritySupport: 'Приоритетная поддержка',
                      earlyAccess: 'Ранний доступ'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-white/70">
                        <input
                          type="checkbox"
                          checked={data.features[key]}
                          onChange={(e) => isEditing && handleChange(`features.${key}`, e.target.checked)}
                          disabled={!isEditing}
                          className="w-4 h-4 rounded border-white/20"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleSave(subscription.tier)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Сохранить изменения
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">Информация</p>
            <ul className="space-y-1 text-blue-200/80">
              <li>• Значение -1 означает безлимит</li>
              <li>• Изменения применяются немедленно для всех пользователей</li>
              <li>• Текущие пользователи сохранят свои тарифы до истечения</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
