// Qibla and Islamic prayer constants

/**
 * Координаты Каабы в Мекке
 * Источник: Google Maps, точные координаты священной Каабы
 */
export const MECCA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8261,
};

/**
 * Размер буфера для сглаживания показаний компаса
 * 8 значений обеспечивают баланс между плавностью и отзывчивостью
 */
export const COMPASS_SMOOTHING_BUFFER_SIZE = 8;

/**
 * Чувствительность компаса (в градусах)
 * Минимальное изменение угла для обновления отображения
 */
export const COMPASS_SENSITIVITY = 0.5;

/**
 * Частота обновления GyroNorm (в миллисекундах)
 */
export const GYRO_UPDATE_FREQUENCY = 100;

/**
 * Таймаут для переключения на ручной режим (в миллисекундах)
 * Если через 3 секунды компас не заработал, включается ручной режим
 */
export const COMPASS_FALLBACK_TIMEOUT = 3000;