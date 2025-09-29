// Коллекция качественных религиозных фонов с Unsplash
export const islamicBackgrounds = {
  // Главная страница - мечети и исламская архитектура
  home: [
    'https://images.unsplash.com/photo-1564769625905-50e93615e769?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Мечеть на закате
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Голубая мечеть
    'https://images.unsplash.com/photo-1591288495669-42bdf4fe2157?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Исламская архитектура
  ],

  // Библиотека - книги и каллиграфия
  library: [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Открытый Коран
    'https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Древние книги
    'https://images.unsplash.com/photo-1609706808980-8c37dadc0c15?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Исламская каллиграфия
    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Рукописи
  ],

  // Нашиды - музыкальная тематика
  nashids: [
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Музыкальные инструменты
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Традиционные инструменты
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Звуковые волны
  ],

  // Кибла - направление молитвы, компас, звезды
  qibla: [
    'https://images.unsplash.com/photo-1591213954208-66b9e6ba0e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Кааба ночью
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Звездное небо
    'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Компас
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Мечеть в ночи
  ],

  // Читалка книг - спокойные, располагающие к чтению фоны
  reader: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Природа и свет
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Мягкий закат
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Горные пейзажи
  ],

  // Дополнительные исламские мотивы
  patterns: [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Геометрические узоры
    'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Арабские узоры
  ]
};

// Функция для случайного выбора фона из категории
export const getRandomBackground = (category) => {
  const backgrounds = islamicBackgrounds[category];
  if (!backgrounds || backgrounds.length === 0) {
    return islamicBackgrounds.home[0]; // Фон по умолчанию
  }
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
};

// Функция для получения фона с градиентным оверлеем
export const getBackgroundWithOverlay = (category, opacity = 0.4) => {
  const backgroundUrl = getRandomBackground(category);
  return {
    backgroundImage: `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
};

// Фоны по времени дня (для динамических фонов)
export const getTimeBasedBackground = (category) => {
  const hour = new Date().getHours();
  let timeCategory = category;

  if (hour >= 5 && hour < 12) {
    // Утро - светлые тона
    timeCategory = 'morning';
  } else if (hour >= 12 && hour < 18) {
    // День - яркие тона
    timeCategory = 'day';
  } else if (hour >= 18 && hour < 22) {
    // Вечер - закатные тона
    timeCategory = 'evening';
  } else {
    // Ночь - темные тона
    timeCategory = 'night';
  }

  return getRandomBackground(category);
};

// Дополнительная коллекция по времени дня
export const timeBasedBackgrounds = {
  morning: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  ],
  day: [
    'https://images.unsplash.com/photo-1564769625905-50e93615e769?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1591288495669-42bdf4fe2157?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  ],
  evening: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  ],
  night: [
    'https://images.unsplash.com/photo-1591213954208-66b9e6ba0e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  ]
};