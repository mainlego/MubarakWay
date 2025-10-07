import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const DebugConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Перехватываем console.log, console.error, console.warn
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
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    setLogs(prev => [...prev, {
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    }].slice(-50)); // Храним последние 50 логов
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-400 bg-red-500/10';
      case 'warn':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-gray-300 bg-gray-800/50';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors z-50 font-mono text-sm"
      >
        🐛 Debug Console ({logs.length})
      </button>
    );
  }

  return (
    <div className={`fixed bottom-0 right-0 left-0 bg-gray-900 border-t-2 border-purple-500 shadow-2xl z-50 transition-all duration-300 ${
      isMinimized ? 'h-12' : 'h-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-purple-400 font-bold font-mono">🐛 Debug Console</span>
          <span className="text-gray-500 text-sm">({logs.length} logs)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div className="h-full overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No logs yet. Logs will appear here...
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded ${getLogColor(log.type)} border-l-4 ${
                  log.type === 'error' ? 'border-red-500' :
                  log.type === 'warn' ? 'border-yellow-500' :
                  'border-gray-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs shrink-0">{log.timestamp}</span>
                  <span className="text-xs uppercase font-bold shrink-0">
                    {log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️'}
                  </span>
                  <pre className="whitespace-pre-wrap break-all flex-1">{log.message}</pre>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DebugConsole;
