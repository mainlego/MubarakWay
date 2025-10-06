import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

/**
 * PreviewModal - универсальный компонент для предпросмотра контента
 * @param {boolean} isOpen - открыто ли модальное окно
 * @param {function} onClose - callback при закрытии
 * @param {string} type - тип контента: 'image', 'pdf', 'audio'
 * @param {string} url - URL контента
 * @param {string} title - заголовок модалки
 */
const PreviewModal = ({ isOpen, onClose, type, url, title = 'Предпросмотр' }) => {
  if (!isOpen || !url) return null;

  const handleDownload = () => {
    window.open(url, '_blank');
  };

  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <div className="flex items-center justify-center p-4 bg-black/20 rounded-lg">
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[70vh] bg-white rounded-lg overflow-hidden">
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={title}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="p-8 flex flex-col items-center gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <audio
              controls
              src={url}
              className="w-full max-w-md"
              preload="metadata"
            >
              Ваш браузер не поддерживает аудио элемент.
            </audio>
            <p className="text-white/60 text-sm text-center">
              {title}
            </p>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <p className="text-white/60">Предпросмотр недоступен для данного типа файла</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-5xl w-full border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur">
          <h2 className="text-lg font-bold text-white truncate pr-4">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Открыть в новой вкладке"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Закрыть"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
