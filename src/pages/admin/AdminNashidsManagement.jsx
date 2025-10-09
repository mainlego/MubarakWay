import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdminApiUrl } from '../../utils/apiConfig';
import {
  Music,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import PreviewModal from '../../components/PreviewModal';

const AdminNashidsManagement = () => {
  const navigate = useNavigate();
  const [nashids, setNashids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNashid, setEditingNashid] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({ type: '', url: '', title: '' });

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    audioUrl: '',
    coverImage: '',
    duration: '',
    category: 'spiritual',
    language: 'ru',
    releaseYear: new Date().getFullYear(),
    accessLevel: 'free'
  });

  const categories = [
    { value: '', label: 'Все категории' },
    { value: 'spiritual', label: 'Духовные' },
    { value: 'family', label: 'Семейные' },
    { value: 'gratitude', label: 'Благодарность' },
    { value: 'prophetic', label: 'О Пророке ﷺ' }
  ];

  const accessLevels = [
    { value: 'free', label: 'Бесплатно (Muslim)' },
    { value: 'pro', label: 'Pro (Mutahsin)' },
    { value: 'premium', label: 'Premium (Sahib)' }
  ];

  useEffect(() => {
    fetchNashids();
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchNashids = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const response = await axios.get(
        `${API_URL}/api/admin/nashids?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNashids(response.data.nashids);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch nashids:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (nashid = null) => {
    if (nashid) {
      setEditingNashid(nashid);
      setFormData({
        title: nashid.title,
        artist: nashid.artist || '',
        audioUrl: nashid.audioUrl || '',
        coverImage: nashid.coverImage || '',
        duration: nashid.duration || '',
        category: nashid.category || 'spiritual',
        language: nashid.language || 'ru',
        releaseYear: nashid.releaseYear || new Date().getFullYear(),
        accessLevel: nashid.accessLevel || 'free'
      });
    } else {
      setEditingNashid(null);
      setFormData({
        title: '',
        artist: '',
        audioUrl: '',
        coverImage: '',
        duration: '',
        category: 'spiritual',
        language: 'ru',
        releaseYear: new Date().getFullYear(),
        accessLevel: 'free'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNashid(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      if (editingNashid) {
        await axios.put(
          `${API_URL}/api/admin/nashids/${editingNashid._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/admin/nashids`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      handleCloseModal();
      fetchNashids();
    } catch (error) {
      console.error('Failed to save nashid:', error);
      alert('Ошибка при сохранении нашида');
    }
  };

  const handlePreview = (type, url, title) => {
    setPreviewData({ type, url, title });
    setShowPreview(true);
  };

  const handleDelete = async (nashidId) => {
    if (!confirm('Вы уверены, что хотите удалить этот нашид?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = getAdminApiUrl();

      await axios.delete(
        `${API_URL}/api/admin/nashids/${nashidId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchNashids();
    } catch (error) {
      console.error('Failed to delete nashid:', error);
      alert('Ошибка при удалении нашида');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDuration = (duration) => {
    if (!duration) return '—';
    const parts = duration.split(':');
    if (parts.length === 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return duration;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Управление нашидами
          </h1>
          <p className="text-white/60">
            Всего нашидов: {nashids.length}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Добавить нашид
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Поиск по названию или исполнителю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value} className="bg-slate-800">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nashids Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Загрузка...</p>
          </div>
        ) : nashids.length === 0 ? (
          <div className="p-12 text-center">
            <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">Нашиды не найдены</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Обложка</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Название</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Исполнитель</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Категория</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Длительность</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Доступ</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {nashids.map((nashid) => (
                    <tr key={nashid._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        {nashid.coverImage ? (
                          <img
                            src={nashid.coverImage}
                            alt={nashid.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center">
                            <Music className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{nashid.title}</p>
                        <p className="text-white/50 text-sm">{nashid.releaseYear}</p>
                      </td>
                      <td className="px-6 py-4 text-white/80">{nashid.artist || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                          {categories.find(c => c.value === nashid.category)?.label || nashid.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80">{formatDuration(nashid.duration)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          nashid.accessLevel === 'premium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : nashid.accessLevel === 'pro'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {accessLevels.find(a => a.value === nashid.accessLevel)?.label.split(' ')[0] || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {nashid.coverImage && (
                            <button
                              onClick={() => handlePreview('image', nashid.coverImage, nashid.title)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Просмотр обложки"
                            >
                              <Eye className="w-4 h-4 text-emerald-400" />
                            </button>
                          )}
                          {nashid.audioUrl && (
                            <button
                              onClick={() => handlePreview('audio', nashid.audioUrl, nashid.title)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Прослушать"
                            >
                              <Music className="w-4 h-4 text-pink-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(nashid)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4 text-purple-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(nashid._id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-white/20 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                {editingNashid ? 'Редактировать нашид' : 'Добавить нашид'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Название *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    placeholder="Введите название нашида"
                  />
                </div>

                {/* Artist */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Исполнитель
                  </label>
                  <input
                    type="text"
                    name="artist"
                    value={formData.artist}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    placeholder="Имя исполнителя"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Категория *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    {categories.filter(c => c.value).map(cat => (
                      <option key={cat.value} value={cat.value} className="bg-slate-800">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Длительность (мм:сс)
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="03:45"
                    pattern="[0-9]{1,2}:[0-9]{2}"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Access Level */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Уровень доступа *
                  </label>
                  <select
                    name="accessLevel"
                    value={formData.accessLevel}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    {accessLevels.map(level => (
                      <option key={level.value} value={level.value} className="bg-slate-800">
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Release Year */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Год выпуска
                  </label>
                  <input
                    type="number"
                    name="releaseYear"
                    value={formData.releaseYear}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Язык
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="ru" className="bg-slate-800">Русский</option>
                    <option value="ar" className="bg-slate-800">Арабский</option>
                    <option value="en" className="bg-slate-800">Английский</option>
                  </select>
                </div>

                {/* Cover Image Upload */}
                <div className="md:col-span-2">
                  <FileUpload
                    category="covers"
                    currentUrl={formData.coverImage}
                    onUploadSuccess={(url) => setFormData(prev => ({ ...prev, coverImage: url }))}
                    onRemove={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                    label="Обложка нашида"
                  />
                </div>

                {/* Cover Image URL (alternative) */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Или введите URL обложки
                  </label>
                  <input
                    type="url"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                {/* Audio Upload */}
                <div className="md:col-span-2">
                  <FileUpload
                    category="nashids"
                    currentUrl={formData.audioUrl}
                    onUploadSuccess={(url) => setFormData(prev => ({ ...prev, audioUrl: url }))}
                    onRemove={() => setFormData(prev => ({ ...prev, audioUrl: '' }))}
                    label="Аудио файл нашида *"
                    maxSize={50}
                  />
                </div>

                {/* Audio URL (alternative) */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Или введите URL аудио файла
                  </label>
                  <input
                    type="url"
                    name="audioUrl"
                    value={formData.audioUrl}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    placeholder="https://example.com/nashid.mp3"
                  />
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
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all"
                >
                  <Save className="w-4 h-4" />
                  {editingNashid ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        type={previewData.type}
        url={previewData.url}
        title={previewData.title}
      />
    </div>
  );
};

export default AdminNashidsManagement;
