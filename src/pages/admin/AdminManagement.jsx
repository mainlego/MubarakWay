import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdminApiUrl } from '../../utils/apiConfig';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Eye,
  EyeOff,
  Crown,
  Star,
  UserCog
} from 'lucide-react';

const AdminManagement = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'editor',
    permissions: {
      canManageBooks: true,
      canManageNashids: true,
      canManageUsers: false,
      canViewAnalytics: true,
      canManageAdmins: false
    }
  });

  const roles = [
    { value: 'admin', label: 'Администратор', icon: <Crown className="w-4 h-4" /> },
    { value: 'moderator', label: 'Модератор', icon: <Star className="w-4 h-4" /> },
    { value: 'editor', label: 'Редактор', icon: <UserCog className="w-4 h-4" /> }
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      const response = await axios.get(
        `${API_URL}/api/admin/admins`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAdmins(response.data.admins);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        username: admin.username,
        email: admin.email,
        password: '',
        role: admin.role,
        permissions: admin.permissions
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'editor',
        permissions: {
          canManageBooks: true,
          canManageNashids: true,
          canManageUsers: false,
          canViewAnalytics: true,
          canManageAdmins: false
        }
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setShowPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      if (editingAdmin) {
        // Update (без пароля)
        const { password, ...updateData } = formData;
        await axios.put(
          `${API_URL}/api/admin/admins/${editingAdmin._id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create
        await axios.post(
          `${API_URL}/api/admin/admins`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      handleCloseModal();
      fetchAdmins();
    } catch (error) {
      console.error('Failed to save admin:', error);
      alert(error.response?.data?.message || 'Ошибка при сохранении администратора');
    }
  };

  const handleDelete = async (adminId) => {
    if (!confirm('Вы уверены, что хотите удалить этого администратора?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      await axios.delete(
        `${API_URL}/api/admin/admins/${adminId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
      alert(error.response?.data?.message || 'Ошибка при удалении администратора');
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    const colors = {
      admin: 'bg-red-500/20 text-red-300 border-red-500/30',
      moderator: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      editor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };

    return {
      label: roleConfig?.label || role,
      icon: roleConfig?.icon,
      className: colors[role] || colors.editor
    };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Управление администраторами
          </h1>
          <p className="text-white/60">
            Управление доступом и правами администраторов
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Добавить администратора
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin mb-4"></div>
            <p className="text-white/60">Загрузка администраторов...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Администраторы не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Администратор</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Роль</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Права доступа</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Создан</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {admins.map((admin) => {
                  const badge = getRoleBadge(admin.role);
                  return (
                    <tr key={admin._id} className="hover:bg-white/5 transition-colors">
                      {/* Admin Info */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{admin.username}</p>
                          <p className="text-white/50 text-sm">{admin.email}</p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${badge.className}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Permissions */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {admin.permissions.canManageBooks && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">Книги</span>
                          )}
                          {admin.permissions.canManageNashids && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Нашиды</span>
                          )}
                          {admin.permissions.canManageUsers && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">Пользователи</span>
                          )}
                          {admin.permissions.canManageAdmins && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">Админы</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          admin.isActive
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {admin.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <p className="text-white/80 text-sm">
                          {formatDate(admin.createdAt)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(admin)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-white/20 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                {editingAdmin ? 'Редактировать администратора' : 'Добавить администратора'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    minLength={3}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                    placeholder="admin"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                    placeholder="admin@example.com"
                  />
                </div>

                {/* Password */}
                {!editingAdmin && (
                  <div className="md:col-span-2">
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Пароль *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingAdmin}
                        minLength={8}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 pr-12 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-white/40 text-xs mt-1">Минимум 8 символов</p>
                  </div>
                )}

                {/* Role */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Роль *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value} className="bg-slate-800">
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permissions */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-3">
                    Права доступа
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'canManageBooks', label: 'Управление книгами' },
                      { key: 'canManageNashids', label: 'Управление нашидами' },
                      { key: 'canManageUsers', label: 'Управление пользователями' },
                      { key: 'canViewAnalytics', label: 'Просмотр аналитики' },
                      { key: 'canManageAdmins', label: 'Управление администраторами' }
                    ].map(permission => (
                      <label
                        key={permission.key}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions[permission.key]}
                          onChange={() => handlePermissionChange(permission.key)}
                          className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-white text-sm">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all"
                >
                  <Save className="w-4 h-4" />
                  {editingAdmin ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
