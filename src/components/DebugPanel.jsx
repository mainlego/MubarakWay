import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { X, ChevronUp, ChevronDown, Copy, Trash2, Download, Filter } from 'lucide-react';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState('all'); // all, api, error, success
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    // Перехватываем console.log
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const addLog = (type, args) => {
    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    setLogs(prev => [...prev.slice(-100), {
      type,
      message,
      timestamp,
      id: Date.now() + Math.random()
    }]);
  };

  const copyToClipboard = () => {
    const text = filteredLogs.map(log =>
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Логи скопированы в буфер обмена!');
    }).catch(() => {
      alert('❌ Ошибка копирования');
    });
  };

  const downloadLogs = () => {
    const text = filteredLogs.map(log =>
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mubarakway-debug-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (confirm('Очистить все логи?')) {
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'api') {
      return log.message.includes('[Books]') ||
             log.message.includes('[Nashids]') ||
             log.message.includes('[API]') ||
             log.message.includes('Fetching') ||
             log.message.includes('Response');
    }
    if (filter === 'error') {
      return log.type === 'error' || log.type === 'warn';
    }
    if (filter === 'success') {
      return log.message.includes('✅') ||
             log.message.includes('Successfully') ||
             log.message.includes('success: true');
    }
    return true;
  });

  const getLogColor = (type, message) => {
    if (type === 'error') return 'text-red-300';
    if (type === 'warn') return 'text-yellow-300';
    if (message.includes('✅')) return 'text-green-300';
    if (message.includes('❌')) return 'text-red-300';
    if (message.includes('[Books]') || message.includes('[Nashids]')) return 'text-blue-300';
    return 'text-gray-300';
  };

  const getLogBg = (type) => {
    if (type === 'error') return 'bg-red-900/20 border-l-4 border-red-500';
    if (type === 'warn') return 'bg-yellow-900/20 border-l-4 border-yellow-500';
    return 'bg-gray-800/30 border-l-4 border-green-500/30';
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[100] bg-gradient-to-b from-slate-900 to-black border-t-2 border-green-500/30 text-white text-xs font-mono max-h-[60vh] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-slate-800/90">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold text-sm">🐛 Debug Console</span>
          <span className="text-gray-400 text-[10px]">
            ({filteredLogs.length}/{logs.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-[10px] transition-colors"
            title="Копировать логи"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            onClick={downloadLogs}
            className="flex items-center gap-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-[10px] transition-colors"
            title="Скачать логи"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded text-[10px] transition-colors"
            title="Очистить логи"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* User Info & Filters */}
          <div className="p-2 border-b border-gray-700 bg-slate-800/50">
            {/* User Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mb-2 p-2 bg-blue-900/20 rounded">
              <div>
                <span className="text-gray-400">Auth:</span>{' '}
                <span className={isAuthenticated ? 'text-green-400 font-bold' : 'text-red-400'}>
                  {isAuthenticated ? '✅ YES' : '❌ NO'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">ID:</span>{' '}
                <span className="text-yellow-300 font-mono">{user?.telegramId || 'null'}</span>
              </div>
              <div>
                <span className="text-gray-400">Name:</span>{' '}
                <span className="text-yellow-300">{user?.firstName || 'null'}</span>
              </div>
              <div>
                <span className="text-gray-400">Tier:</span>{' '}
                <span className="text-purple-300 font-bold">{user?.subscription?.tier || 'null'}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Все ({logs.length})
              </button>
              <button
                onClick={() => setFilter('api')}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  filter === 'api'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📡 API
              </button>
              <button
                onClick={() => setFilter('error')}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  filter === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ❌ Ошибки
              </button>
              <button
                onClick={() => setFilter('success')}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  filter === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ✅ Успешные
              </button>
              <label className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-[10px] cursor-pointer hover:bg-gray-600 ml-auto">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-3 h-3"
                />
                Auto-scroll
              </label>
            </div>
          </div>

          {/* Logs */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-black/50">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm mb-1">📝 Логов нет</p>
                <p className="text-[10px]">
                  {filter === 'all'
                    ? 'Перейдите в Библиотеку или Нашиды для генерации логов'
                    : `Нет логов с фильтром "${filter}"`}
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded ${getLogBg(log.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-[9px] whitespace-nowrap">
                      {log.timestamp}
                    </span>
                    <span className={`text-[9px] font-bold uppercase ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warn' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {log.type}
                    </span>
                    <pre className={`flex-1 whitespace-pre-wrap break-all text-[10px] leading-relaxed ${getLogColor(log.type, log.message)}`}>
                      {log.message}
                    </pre>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Footer hints */}
          <div className="p-2 border-t border-gray-700 bg-slate-900/90">
            <div className="text-[9px] text-gray-400 space-y-0.5">
              <p>💡 <strong>Подсказки:</strong> Нажмите "📡 API" чтобы увидеть только запросы к серверу</p>
              <p>🔍 Ищите <code className="bg-gray-800 px-1 rounded">[Books]</code> и <code className="bg-gray-800 px-1 rounded">[Nashids]</code> для диагностики</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DebugPanel;
