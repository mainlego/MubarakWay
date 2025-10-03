import React, { useState, useMemo } from 'react';
import { Calendar, Download } from 'lucide-react';
import prayerTimesService from '../services/prayerTimesService';

const MonthlyPrayerSchedule = ({ prayerTimes, userLocation }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Генерация расписания на месяц с реальным расчетом
  const generateMonthlySchedule = useMemo(() => {
    if (!userLocation) return [];

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const schedule = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      // Рассчитываем время молитв для каждого дня
      const dayPrayerTimes = prayerTimesService.calculatePrayerTimes(
        date,
        userLocation,
        { calculationMethod: 'MuslimWorldLeague' }
      );

      if (dayPrayerTimes) {
        schedule.push({
          date: day,
          dayOfWeek: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
          fajr: prayerTimesService.formatTime(dayPrayerTimes.fajr),
          sunrise: prayerTimesService.formatTime(dayPrayerTimes.sunrise),
          dhuhr: prayerTimesService.formatTime(dayPrayerTimes.dhuhr),
          asr: prayerTimesService.formatTime(dayPrayerTimes.asr),
          maghrib: prayerTimesService.formatTime(dayPrayerTimes.maghrib),
          isha: prayerTimesService.formatTime(dayPrayerTimes.isha)
        });
      }
    }
    return schedule;
  }, [selectedMonth, userLocation]);

  const schedule = generateMonthlySchedule;

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const handleDownloadPDF = () => {
    // TODO: Генерация PDF с брендингом
    alert('Функция скачивания PDF будет реализована');
  };

  const handleDownloadImage = () => {
    // TODO: Генерация изображения с брендингом
    alert('Функция скачивания изображения будет реализована');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white active:bg-white/30 transition-colors"
            title="Скачать PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex justify-between mb-4">
        <button
          onClick={() => {
            const newDate = new Date(selectedMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            setSelectedMonth(newDate);
          }}
          className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm active:bg-white/30 transition-colors"
        >
          ← Предыдущий
        </button>
        <button
          onClick={() => setSelectedMonth(new Date())}
          className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm active:bg-white/30 transition-colors"
        >
          Сегодня
        </button>
        <button
          onClick={() => {
            const newDate = new Date(selectedMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            setSelectedMonth(newDate);
          }}
          className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm active:bg-white/30 transition-colors"
        >
          Следующий →
        </button>
      </div>

      {/* Schedule Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/20">
                <th className="px-2 py-2 text-left text-white font-medium">День</th>
                <th className="px-2 py-2 text-center text-white font-medium">Фаджр</th>
                <th className="px-2 py-2 text-center text-white font-medium">Восход</th>
                <th className="px-2 py-2 text-center text-white font-medium">Зухр</th>
                <th className="px-2 py-2 text-center text-white font-medium">Аср</th>
                <th className="px-2 py-2 text-center text-white font-medium">Магриб</th>
                <th className="px-2 py-2 text-center text-white font-medium">Иша</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((day, index) => {
                const isToday = day.date === new Date().getDate() &&
                               selectedMonth.getMonth() === new Date().getMonth() &&
                               selectedMonth.getFullYear() === new Date().getFullYear();

                return (
                  <tr
                    key={index}
                    className={`border-t border-white/10 ${isToday ? 'bg-green-500/20' : ''}`}
                  >
                    <td className="px-2 py-2 text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{day.date}</span>
                        <span className="text-xs text-white/60">{day.dayOfWeek}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-white/90 text-xs">{day.fajr}</td>
                    <td className="px-2 py-2 text-center text-white/70 text-xs">{day.sunrise}</td>
                    <td className="px-2 py-2 text-center text-white/90 text-xs">{day.dhuhr}</td>
                    <td className="px-2 py-2 text-center text-white/90 text-xs">{day.asr}</td>
                    <td className="px-2 py-2 text-center text-white/90 text-xs">{day.maghrib}</td>
                    <td className="px-2 py-2 text-center text-white/90 text-xs">{day.isha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location info */}
      {userLocation && (
        <div className="mt-3 text-center text-white/60 text-xs">
          Расчет для: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </div>
      )}

      {/* Download options */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDownloadPDF}
          className="flex-1 py-2 px-4 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Скачать PDF
        </button>
        <button
          onClick={handleDownloadImage}
          className="flex-1 py-2 px-4 bg-purple-600 active:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Скачать картинку
        </button>
      </div>
    </div>
  );
};

export default MonthlyPrayerSchedule;
