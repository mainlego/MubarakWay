import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
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

  const addLog = (type, args) => {
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

    setLogs(prev => [...prev.slice(-50), { type, message, time: new Date().toLocaleTimeString() }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[100] bg-black/95 text-white text-xs font-mono max-h-[50vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <span className="font-bold">🐛 Debug Panel</span>
          <span className="text-gray-400">({logs.length} logs)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const logsText = logs.map(log => `[${log.time}] ${log.type}: ${log.message}`).join('\n');
              navigator.clipboard.writeText(logsText);
              alert('Логи скопированы в буфер обмена!');
            }}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-[10px]"
          >
            Copy
          </button>
          <button
            onClick={clearLogs}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-[10px]"
          >
            Clear
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* User Info */}
          <div className="p-2 border-b border-gray-700 bg-blue-900/30">
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>
                <span className="text-gray-400">Authenticated:</span>{' '}
                <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                  {isAuthenticated ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">User ID:</span>{' '}
                <span className="text-yellow-300">{user?.telegramId || 'null'}</span>
              </div>
              <div>
                <span className="text-gray-400">Name:</span>{' '}
                <span className="text-yellow-300">{user?.firstName || 'null'}</span>
              </div>
              <div>
                <span className="text-gray-400">Tier:</span>{' '}
                <span className="text-yellow-300">{user?.subscription?.tier || 'null'}</span>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No logs yet</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-1 rounded ${
                    log.type === 'error'
                      ? 'bg-red-900/30 text-red-200'
                      : log.type === 'warn'
                      ? 'bg-yellow-900/30 text-yellow-200'
                      : 'bg-gray-800/50'
                  }`}
                >
                  <span className="text-gray-500">[{log.time}]</span>{' '}
                  <span className="text-gray-400">{log.type}:</span>{' '}
                  <span className="whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DebugPanel;
