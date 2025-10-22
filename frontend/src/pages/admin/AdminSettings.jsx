import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdminApiUrl } from '../../utils/apiConfig';
import {
  Settings,
  User,
  Lock,
  Mail,
  Save,
  LogOut,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    username: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    try {
      const adminData = localStorage.getItem('adminData');
      if (adminData) {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
        setProfileData({
          username: parsedAdmin.username || '',
          email: parsedAdmin.email || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      const response = await axios.put(
        `${API_URL}/api/admin/profile`,
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update localStorage with new data
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
        setAdmin(response.data.admin);
        setMessage({ type: 'success', text: 'Профиль успешно обновлен' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Ошибка при сохранении профиля'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' });
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Пароль должен быть не менее 8 символов' });
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      const response = await axios.put(
        `${API_URL}/api/admin/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Пароль успешно изменен' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Ошибка при изменении пароля'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Настройки администратора
        </h1>
        <p className="text-white/60">
          Управление профилем и безопасностью
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Admin Info Card */}
      <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/30">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-400/20 rounded-full">
            <Shield className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{admin?.username}</h3>
            <p className="text-emerald-300 text-sm">
              {admin?.role === 'admin' ? 'Администратор' :
               admin?.role === 'moderator' ? 'Модератор' : 'Редактор'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Профиль</h2>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Имя пользователя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                required
                minLength={3}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                placeholder="username"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Settings */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Безопасность</h2>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Текущий пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Новый пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-white/40 text-xs mt-1">Минимум 8 символов</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Подтвердите новый пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Change Password Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {saving ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/30 overflow-hidden">
        <div className="p-6 border-b border-red-500/20">
          <h2 className="text-xl font-bold text-red-300">Опасная зона</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium mb-1">Выйти из аккаунта</h3>
              <p className="text-white/60 text-sm">
                Завершить сеанс и вернуться на страницу входа
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-semibold rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
