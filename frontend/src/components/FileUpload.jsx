import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Music, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEBUG = import.meta.env.MODE === 'development';

// Debug logger - only logs in development mode
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

/**
 * FileUpload Component
 *
 * @param {string} category - Категория файла: 'covers', 'books', 'nashids'
 * @param {string} currentUrl - Текущий URL файла (для превью)
 * @param {function} onUploadSuccess - Callback при успешной загрузке (fileUrl)
 * @param {function} onRemove - Callback при удалении файла
 * @param {string} accept - MIME типы файлов (по умолчанию зависит от category)
 * @param {number} maxSize - Максимальный размер в MB (по умолчанию 100MB)
 */
const FileUpload = ({
  category = 'covers',
  currentUrl = '',
  onUploadSuccess,
  onRemove,
  accept,
  maxSize = 100,
  label = 'Загрузить файл'
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const fileInputRef = useRef(null);

  // Логируем props при монтировании и изменении category
  React.useEffect(() => {
    debugLog('🎨 [FileUpload] Component mounted/updated with props:', {
      category,
      label,
      currentUrl
    });
  }, [category, label, currentUrl]);

  // Определяем допустимые типы файлов по категории
  const getAcceptTypes = () => {
    if (accept) return accept;

    switch (category) {
      case 'covers':
        return 'image/*';
      case 'books':
        return 'application/pdf';
      case 'nashids':
        return 'audio/*';
      default:
        return '*/*';
    }
  };

  // Определяем иконку по категории
  const getCategoryIcon = () => {
    switch (category) {
      case 'covers':
        return <ImageIcon className="w-8 h-8 text-emerald-400" />;
      case 'books':
        return <FileText className="w-8 h-8 text-emerald-400" />;
      case 'nashids':
        return <Music className="w-8 h-8 text-emerald-400" />;
      default:
        return <File className="w-8 h-8 text-emerald-400" />;
    }
  };

  // Валидация размера файла
  const validateFileSize = (file) => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`Размер файла не должен превышать ${maxSize}MB`);
      return false;
    }
    return true;
  };

  // Обработка выбора файла
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');

    // Валидация размера
    if (!validateFileSize(file)) {
      return;
    }

    // Создаем превью для изображений
    if (category === 'covers' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }

    // Загружаем файл на сервер
    await uploadFile(file);
  };

  // Загрузка файла
  const uploadFile = async (file) => {
    debugLog('🔍 [FileUpload] Starting upload with:', {
      category,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      label
    });

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      // ВАЖНО: category должен быть ПЕРЕД file, чтобы multer успел его прочитать
      formData.append('category', category);
      formData.append('file', file);

      // Проверяем что FormData содержит
      debugLog('📦 [FileUpload] FormData prepared:', {
        category: formData.get('category'),
        hasFile: formData.has('file')
      });

      const token = localStorage.getItem('adminToken');

      const response = await axios.post(`${API_URL}/upload?category=${category}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        // Сервер возвращает полный URL, используем его напрямую
        const fileUrl = response.data.file.url;
        debugLog('✅ [FileUpload] File uploaded successfully:', fileUrl);
        setPreviewUrl(fileUrl);
        onUploadSuccess?.(fileUrl);
        setUploadProgress(100);
      } else {
        setError(response.data.message || 'Ошибка загрузки файла');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  // Удаление файла
  const handleRemove = async (e) => {
    // Предотвращаем всплытие события и дефолтное поведение
    e.preventDefault();
    e.stopPropagation();

    if (!previewUrl) return;

    debugLog('🗑️ [FileUpload] Removing file:', previewUrl);

    try {
      const token = localStorage.getItem('adminToken');

      // Отправляем полный URL на сервер - он сам извлечёт путь
      await axios.delete(`${API_URL}/upload`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { fileUrl: previewUrl }
      });

      debugLog('✅ [FileUpload] File removed successfully');

      // Очищаем состояние
      setPreviewUrl('');
      setUploadProgress(0);
      setError('');

      // Вызываем callback родителя
      onRemove?.();

      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('❌ [FileUpload] Delete file error:', error);
      setError('Ошибка удаления файла');
    }
  };

  // Открываем диалог выбора файла
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>

      {/* Превью загруженного файла */}
      {previewUrl && (
        <div className="relative rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
          {category === 'covers' ? (
            <div className="relative w-full h-48">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors z-10"
                title="Удалить файл"
                aria-label="Удалить файл"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon()}
                <div>
                  <p className="text-sm text-gray-300">Файл загружен</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {previewUrl.split('/').pop()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                title="Удалить файл"
                aria-label="Удалить файл"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Кнопка загрузки / прогресс */}
      {!previewUrl && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="w-full px-4 py-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-sm text-gray-400">Загрузка... {uploadProgress}%</p>
                  <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">
                      Нажмите для выбора файла
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {category === 'covers' && 'Изображения (JPG, PNG, WebP)'}
                      {category === 'books' && 'PDF файлы'}
                      {category === 'nashids' && 'Аудио файлы (MP3, WAV, OGG)'}
                      {' • '}
                      Максимум {maxSize}MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Сообщение об успехе */}
      {uploadProgress === 100 && !uploading && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="text-sm text-emerald-400">Файл успешно загружен</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
