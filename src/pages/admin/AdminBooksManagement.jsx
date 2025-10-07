import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import PreviewModal from '../../components/PreviewModal';

const AdminBooksManagement = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({ type: '', url: '', title: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    cover: '',
    content: '',
    category: 'religious',
    genre: 'tafsir',
    language: 'ru',
    pages: 0,
    publishedYear: new Date().getFullYear(),
    isPro: false
  });

  const categories = [
    { value: '', label: 'Все категории' },
    { value: 'religious', label: 'Религиозная' },
    { value: 'education', label: 'Образование' },
    { value: 'spiritual', label: 'Духовная' }
  ];

  const genres = [
    { value: '', label: 'Все жанры' },
    { value: 'tafsir', label: 'Тафсир' },
    { value: 'hadith', label: 'Хадисы' },
    { value: 'aqidah', label: 'Акида' },
    { value: 'prophets', label: 'Пророки' },
    { value: 'quran', label: 'Коран' },
    { value: 'islam', label: 'Ислам' }
  ];

  const languages = [
    { value: '', label: 'Все языки' },
    { value: 'ru', label: 'Русский' },
    { value: 'ar', label: 'Арабский' },
    { value: 'en', label: 'Английский' }
  ];

  const accessLevels = [
    { value: 'free', label: 'Бесплатно (Muslim)' },
    { value: 'pro', label: 'Pro (Mutahsin)' },
    { value: 'premium', label: 'Premium (Sahib)' }
  ];

  useEffect(() => {
    fetchBooks();
  }, [currentPage, searchTerm, categoryFilter, languageFilter]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(languageFilter && { language: languageFilter })
      });

      const response = await axios.get(
        `${API_URL}/api/admin/books?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setBooks(response.data.books);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author || '',
        description: book.description || '',
        coverImage: book.coverImage || '',
        pdfUrl: book.pdfUrl || '',
        category: book.category || 'tafsir',
        language: book.language || 'ru',
        pages: book.pages || 0,
        publishedYear: book.publishedYear || new Date().getFullYear(),
        accessLevel: book.accessLevel || 'free'
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: '',
        author: '',
        description: '',
        coverImage: '',
        pdfUrl: '',
        category: 'tafsir',
        language: 'ru',
        pages: 0,
        publishedYear: new Date().getFullYear(),
        accessLevel: 'free'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBook(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      if (editingBook) {
        // Update
        await axios.put(
          `${API_URL}/api/admin/books/${editingBook._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create
        await axios.post(
          `${API_URL}/api/admin/books`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      handleCloseModal();
      fetchBooks();
    } catch (error) {
      console.error('Failed to save book:', error);
      alert('Ошибка при сохранении книги');
    }
  };

  const handlePreview = (type, url, title) => {
    setPreviewData({ type, url, title });
    setShowPreview(true);
  };

  const handleDelete = async (bookId) => {
    if (!confirm('Вы уверены, что хотите удалить эту книгу?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      await axios.delete(
        `${API_URL}/api/admin/books/${bookId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchBooks();
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Ошибка при удалении книги');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Управление книгами
          </h1>
          <p className="text-white/60">
            Всего книг: {books.length}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Добавить книгу
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Поиск по названию или автору..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-400"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value} className="bg-slate-800">
                {cat.label}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-400"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value} className="bg-slate-800">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Загрузка...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">Книги не найдены</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Обложка</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Название</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Автор</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Категория</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Язык</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Доступ</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {books.map((book) => (
                    <tr key={book._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-white/10 rounded flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{book.title}</p>
                        <p className="text-white/50 text-sm">{book.pages} стр.</p>
                      </td>
                      <td className="px-6 py-4 text-white/80">{book.author || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {categories.find(c => c.value === book.category)?.label || book.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80 uppercase">{book.language}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          book.accessLevel === 'premium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : book.accessLevel === 'pro'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {accessLevels.find(a => a.value === book.accessLevel)?.label.split(' ')[0] || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {book.coverImage && (
                            <button
                              onClick={() => handlePreview('image', book.coverImage, book.title)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Просмотр обложки"
                            >
                              <Eye className="w-4 h-4 text-emerald-400" />
                            </button>
                          )}
                          {book.pdfUrl && (
                            <button
                              onClick={() => handlePreview('pdf', book.pdfUrl, book.title)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Просмотр PDF"
                            >
                              <BookOpen className="w-4 h-4 text-purple-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(book)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(book._id)}
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
                {editingBook ? 'Редактировать книгу' : 'Добавить книгу'}
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
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                    placeholder="Введите название книги"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Автор
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                    placeholder="Имя автора"
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
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                  >
                    {categories.filter(c => c.value).map(cat => (
                      <option key={cat.value} value={cat.value} className="bg-slate-800">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Жанр *
                  </label>
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                  >
                    {genres.filter(g => g.value).map(genre => (
                      <option key={genre.value} value={genre.value} className="bg-slate-800">
                        {genre.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Язык *
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                  >
                    {languages.filter(l => l.value).map(lang => (
                      <option key={lang.value} value={lang.value} className="bg-slate-800">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pro/Premium Access */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPro"
                      checked={formData.isPro}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPro: e.target.checked }))}
                      className="w-5 h-5 bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-white/80 text-sm font-medium">Премиум контент (только для Pro/Sahib)</span>
                  </label>
                </div>

                {/* Cover Image Upload */}
                <div className="md:col-span-2">
                  <FileUpload
                    category="covers"
                    currentUrl={formData.cover}
                    onUploadSuccess={(url) => setFormData(prev => ({ ...prev, cover: url }))}
                    onRemove={() => setFormData(prev => ({ ...prev, cover: '' }))}
                    label="Обложка книги *"
                  />
                </div>

                {/* Cover Image URL (alternative) */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Или введите URL обложки
                  </label>
                  <input
                    type="url"
                    name="cover"
                    value={formData.cover}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                {/* PDF Upload */}
                <div className="md:col-span-2">
                  <FileUpload
                    category="books"
                    currentUrl={formData.content}
                    onUploadSuccess={(url) => setFormData(prev => ({ ...prev, content: url }))}
                    onRemove={() => setFormData(prev => ({ ...prev, content: '' }))}
                    label="PDF файл книги *"
                  />
                </div>

                {/* PDF URL (alternative) */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Или введите URL PDF файла
                  </label>
                  <input
                    type="url"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                    placeholder="https://example.com/book.pdf"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 resize-none"
                    placeholder="Краткое описание книги..."
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
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all"
                >
                  <Save className="w-4 h-4" />
                  {editingBook ? 'Сохранить' : 'Добавить'}
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

export default AdminBooksManagement;
