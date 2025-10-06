import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Bell, Volume2, Vibrate, Clock, Save } from 'lucide-react';
import { selectUser } from '../store/slices/authSlice';
import { authAPI } from '../services/api';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    reminderBefore: 10,
    atPrayerTime: true,
    prayers: {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true
    },
    telegramOnly: false
  });

  // Загрузка настроек при монтировании
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.telegramId) return;

      try {
        const response = await authAPI.getNotifications(user.telegramId);
        if (response.success && response.notifications) {
          setSettings(response.notifications);
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user?.telegramId) return;

    setSaving(true);
    try {
      await authAPI.saveNotifications(user.telegramId, settings);
      alert('✅ Настройки сохранены');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert('❌ Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrayer = (prayer) => {
    setSettings(prev => ({
      ...prev,
      prayers: {
        ...prev.prayers,
        [prayer]: !prev.prayers[prayer]
      }
    }));
  };

  const setReminderTime = (minutes) => {
    setSettings(prev => ({ ...prev, reminderBefore: minutes }));
  };

  const prayerNames = {
    fajr: 'Фаджр',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магриб',
    isha: 'Иша'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 pt-16 flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 pt-16 pb-20">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Уведомления</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Main Toggle */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Включить уведомления</div>
                <div className="text-sm text-white/60">Общие уведомления о молитвах</div>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('enabled')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.enabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </button>
          </div>
        </div>

        {/* Notification Type */}
        {settings.enabled && (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/60 px-2">Тип уведомлений</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
                <button
                  onClick={() => toggleSetting('sound')}
                  className="w-full flex items-center justify-between p-4 border-b border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-white" />
                    <span className="text-white">Звук</span>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.sound ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                        settings.sound ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </button>

                <button
                  onClick={() => toggleSetting('vibration')}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Vibrate className="w-5 h-5 text-white" />
                    <span className="text-white">Вибрация</span>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.vibration ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                        settings.vibration ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Reminder Time */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/60 px-2">Напоминание до молитвы</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-white" />
                  <span className="text-white">За {settings.reminderBefore} минут</span>
                </div>
                <div className="flex gap-2">
                  {[0, 5, 10, 15, 30].map(minutes => (
                    <button
                      key={minutes}
                      onClick={() => setReminderTime(minutes)}
                      className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
                        settings.reminderBefore === minutes
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {minutes === 0 ? 'Нет' : `${minutes}м`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prayer Time Notification */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/60 px-2">При наступлении времени</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <button
                  onClick={() => toggleSetting('atPrayerTime')}
                  className="w-full flex items-center justify-between"
                >
                  <span className="text-white">Уведомлять в момент молитвы</span>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.atPrayerTime ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                        settings.atPrayerTime ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Individual Prayers */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/60 px-2">Уведомления для молитв</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
                {Object.entries(prayerNames).map(([key, name], index) => (
                  <button
                    key={key}
                    onClick={() => togglePrayer(key)}
                    className={`w-full flex items-center justify-between p-4 ${
                      index < Object.keys(prayerNames).length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <span className="text-white">{name}</span>
                    <div
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.prayers[key] ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                          settings.prayers[key] ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Telegram Only */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/60 px-2">Канал уведомлений</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <button
                  onClick={() => toggleSetting('telegramOnly')}
                  className="w-full flex items-center justify-between"
                >
                  <div>
                    <div className="text-white">Только в Telegram</div>
                    <div className="text-sm text-white/60">Отключить уведомления в приложении</div>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.telegramOnly ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                        settings.telegramOnly ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
