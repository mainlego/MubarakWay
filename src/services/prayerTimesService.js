import { Coordinates, CalculationMethod, HighLatitudeRule, Madhab, PrayerTimes, Qibla } from 'adhan';
import { offlinePrayerTimes } from './offlineStorage';

// Методы расчета
export const calculationMethods = {
  MUSLIM_WORLD_LEAGUE: 'MuslimWorldLeague',
  EGYPTIAN: 'Egyptian',
  KARACHI: 'Karachi',
  UMM_AL_QURA: 'UmmAlQura',
  DUBAI: 'Dubai',
  MOON_SIGHTING_COMMITTEE: 'MoonSightingCommittee',
  NORTH_AMERICA: 'NorthAmerica',
  KUWAIT: 'Kuwait',
  QATAR: 'Qatar',
  SINGAPORE: 'Singapore',
  TEHRAN: 'Tehran',
  DIYANET: 'Diyanet'
};

// Мазхабы
export const madhabs = {
  SHAFI: 'Shafi',
  HANAFI: 'Hanafi'
};

// Правила для высоких широт
export const highLatitudeRules = {
  MIDDLE_OF_THE_NIGHT: 'MiddleOfTheNight',
  SEVENTH_OF_THE_NIGHT: 'SeventhOfTheNight',
  TWILIGHT_ANGLE: 'TwilightAngle'
};

// Настройки по умолчанию
const defaultSettings = {
  calculationMethod: calculationMethods.MUSLIM_WORLD_LEAGUE,
  madhab: madhabs.SHAFI,
  highLatitudeRule: highLatitudeRules.MIDDLE_OF_THE_NIGHT,
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  }
};

class PrayerTimesService {
  constructor() {
    this.currentLocation = null;
    this.settings = { ...defaultSettings };
    this.watchId = null;
    this.lastCalculatedDate = null;
    this.lastPrayerTimes = null;
  }

  // Получить текущее местоположение
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается браузером'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Ошибка получения местоположения';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Доступ к геолокации запрещен пользователем';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Информация о местоположении недоступна';
              break;
            case error.TIMEOUT:
              errorMessage = 'Таймаут запроса местоположения';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 минут
        }
      );
    });
  }

  // Следить за изменениями местоположения
  watchLocation(callback) {
    if (!navigator.geolocation) {
      return null;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        this.currentLocation = location;
        callback(location);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 600000 // 10 минут
      }
    );

    return this.watchId;
  }

  // Остановить слежение за местоположением
  stopWatchingLocation() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Рассчитать время молитв
  calculatePrayerTimes(date = new Date(), location = null, settings = null) {
    try {
      const loc = location || this.currentLocation;
      const sett = { ...this.settings, ...settings };

      if (!loc) {
        throw new Error('Местоположение не определено');
      }

      // Создаем координаты
      const coordinates = new Coordinates(loc.latitude, loc.longitude);

      // Получаем метод расчета напрямую из библиотеки
      const params = CalculationMethod[sett.calculationMethod]();

      // Устанавливаем мазхаб
      if (sett.madhab === madhabs.HANAFI) {
        params.madhab = Madhab.Hanafi;
      } else {
        params.madhab = Madhab.Shafi;
      }

      // Устанавливаем правило для высоких широт
      switch (sett.highLatitudeRule) {
        case highLatitudeRules.SEVENTH_OF_THE_NIGHT:
          params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
          break;
        case highLatitudeRules.TWILIGHT_ANGLE:
          params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
          break;
        default:
          params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
      }

      // Применяем корректировки
      if (sett.adjustments) {
        params.adjustments = {
          fajr: sett.adjustments.fajr || 0,
          sunrise: sett.adjustments.sunrise || 0,
          dhuhr: sett.adjustments.dhuhr || 0,
          asr: sett.adjustments.asr || 0,
          maghrib: sett.adjustments.maghrib || 0,
          isha: sett.adjustments.isha || 0
        };
      }

      // Рассчитываем время молитв
      const prayerTimes = new PrayerTimes(coordinates, date, params);

      // Форматируем результат
      const formattedTimes = {
        fajr: prayerTimes.fajr,
        sunrise: prayerTimes.sunrise,
        dhuhr: prayerTimes.dhuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
        date: date,
        location: loc,
        settings: sett,
        qibla: new Qibla(coordinates).direction
      };

      this.lastCalculatedDate = date;
      this.lastPrayerTimes = formattedTimes;

      return formattedTimes;
    } catch (error) {
      console.error('Error calculating prayer times:', error);
      throw error;
    }
  }

  // Получить текущую молитву (ту, которая идет сейчас)
  getCurrentPrayer(prayerTimes = null) {
    const times = prayerTimes || this.lastPrayerTimes;
    if (!times) return null;

    const now = new Date();
    const prayers = [
      { name: 'fajr', time: times.fajr, displayName: 'Фаджр' },
      { name: 'sunrise', time: times.sunrise, displayName: 'Восход' },
      { name: 'dhuhr', time: times.dhuhr, displayName: 'Зухр' },
      { name: 'asr', time: times.asr, displayName: 'Аср' },
      { name: 'maghrib', time: times.maghrib, displayName: 'Магриб' },
      { name: 'isha', time: times.isha, displayName: 'Иша' }
    ];

    // Находим текущую молитву (которая уже началась, но следующая еще не наступила)
    let currentPrayer = null;
    for (let i = prayers.length - 1; i >= 0; i--) {
      if (now >= prayers[i].time) {
        currentPrayer = prayers[i];
        break;
      }
    }

    // Если время до Фаджр, то текущая молитва - Иша предыдущего дня
    if (!currentPrayer) {
      currentPrayer = {
        name: 'isha',
        time: times.isha,
        displayName: 'Иша'
      };
    }

    return currentPrayer;
  }

  // Получить следующую молитву
  getNextPrayer(prayerTimes = null) {
    const times = prayerTimes || this.lastPrayerTimes;
    if (!times) return null;

    const now = new Date();
    const prayers = [
      { name: 'fajr', time: times.fajr, displayName: 'Фаджр' },
      { name: 'sunrise', time: times.sunrise, displayName: 'Восход' },
      { name: 'dhuhr', time: times.dhuhr, displayName: 'Зухр' },
      { name: 'asr', time: times.asr, displayName: 'Аср' },
      { name: 'maghrib', time: times.maghrib, displayName: 'Магриб' },
      { name: 'isha', time: times.isha, displayName: 'Иша' }
    ];

    // Находим следующую молитву
    let nextPrayer = null;
    for (let i = 0; i < prayers.length; i++) {
      if (now < prayers[i].time) {
        nextPrayer = prayers[i];
        break;
      }
    }

    // Если время после Иша, то следующая молитва - Фаджр следующего дня
    if (!nextPrayer) {
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayTimes = this.calculatePrayerTimes(nextDay, times.location, times.settings);
      nextPrayer = {
        name: 'fajr',
        time: nextDayTimes.fajr,
        displayName: 'Фаджр'
      };
    }

    return nextPrayer;
  }

  // Получить время до следующей молитвы
  getTimeUntilNextPrayer(prayerTimes = null) {
    const nextPrayer = this.getNextPrayer(prayerTimes);
    if (!nextPrayer) return null;

    const now = new Date();
    const diff = nextPrayer.time - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      prayer: nextPrayer,
      totalMilliseconds: diff,
      hours,
      minutes,
      seconds,
      formatted: `${hours}ч ${minutes}м`
    };
  }

  // Форматировать время
  formatTime(date, format = '24h') {
    if (!date) return '';

    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h'
    };

    return date.toLocaleTimeString('ru-RU', options);
  }

  // Получить направление киблы
  getQiblaDirection(location = null) {
    const loc = location || this.currentLocation;

    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number' ||
        isNaN(loc.latitude) || isNaN(loc.longitude)) {
      console.warn('No valid location for qibla calculation:', loc);
      return null;
    }

    try {
      const coordinates = new Coordinates(loc.latitude, loc.longitude);
      const qibla = new Qibla(coordinates);
      const direction = qibla.direction;

      console.log('Qibla direction calculated:', direction, 'for location:', loc);

      // Нормализуем направление (0-360)
      if (typeof direction === 'number' && !isNaN(direction)) {
        let normalized = direction % 360;
        if (normalized < 0) normalized += 360;
        return normalized;
      }

      console.warn('Qibla library returned invalid direction:', direction);
      return null;
    } catch (error) {
      console.error('Error calculating qibla direction:', error);
      return null;
    }
  }

  // Сохранить настройки
  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    // Сохраняем в localStorage
    localStorage.setItem('prayerTimesSettings', JSON.stringify(this.settings));

    return this.settings;
  }

  // Загрузить настройки
  async loadSettings() {
    try {
      const saved = localStorage.getItem('prayerTimesSettings');
      if (saved) {
        this.settings = { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...defaultSettings };
    }

    return this.settings;
  }

  // Сохранить время молитв для офлайн использования
  async savePrayerTimesOffline(date, location, prayerTimes, settings) {
    try {
      await offlinePrayerTimes.savePrayerTimes(date, location, prayerTimes, settings.calculationMethod);
      return true;
    } catch (error) {
      console.error('Error saving prayer times offline:', error);
      return false;
    }
  }

  // Загрузить время молитв из офлайн хранилища
  async loadPrayerTimesOffline(date) {
    try {
      return await offlinePrayerTimes.getPrayerTimes(date);
    } catch (error) {
      console.error('Error loading prayer times offline:', error);
      return null;
    }
  }

  // Получить время молитв с поддержкой офлайн режима
  async getPrayerTimesWithOfflineSupport(date = new Date(), location = null, settings = null) {
    try {
      // Сначала пытаемся рассчитать онлайн
      if (navigator.onLine) {
        const prayerTimes = this.calculatePrayerTimes(date, location, settings);

        // Сохраняем для офлайн использования
        await this.savePrayerTimesOffline(date, location || this.currentLocation, prayerTimes, settings || this.settings);

        return prayerTimes;
      } else {
        // Загружаем из офлайн хранилища
        const offlineTimes = await this.loadPrayerTimesOffline(date);
        if (offlineTimes) {
          return {
            ...offlineTimes.times,
            isOffline: true
          };
        }

        throw new Error('Нет сохраненных данных для офлайн режима');
      }
    } catch (error) {
      // Если онлайн расчет не удался, пытаемся загрузить из офлайн
      const offlineTimes = await this.loadPrayerTimesOffline(date);
      if (offlineTimes) {
        return {
          ...offlineTimes.times,
          isOffline: true
        };
      }

      throw error;
    }
  }

  // Получить время молитв на несколько дней
  async getPrayerTimesForDays(startDate, numberOfDays = 7, location = null, settings = null) {
    const results = [];

    for (let i = 0; i < numberOfDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      try {
        const prayerTimes = await this.getPrayerTimesWithOfflineSupport(date, location, settings);
        results.push(prayerTimes);
      } catch (error) {
        console.error(`Error calculating prayer times for ${date}:`, error);
        results.push(null);
      }
    }

    return results;
  }

  // Установить уведомления (если поддерживается)
  async setupNotifications() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Отправить уведомление о времени молитвы
  sendPrayerNotification(prayerName, time) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(`Время молитвы: ${prayerName}`, {
      body: `${prayerName} - ${this.formatTime(time)}`,
      icon: '/prayer-icon.png',
      tag: 'prayer-time',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Автоматически закрыть через 10 секунд
    setTimeout(() => {
      notification.close();
    }, 10000);
  }
}

export default new PrayerTimesService();